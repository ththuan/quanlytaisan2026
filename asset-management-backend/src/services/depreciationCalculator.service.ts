/**
 * Depreciation Calculator Service
 * Service tính toán khấu hao chính xác theo Thông tư 141/2025/TT-BTC
 * 
 * Đảm bảo:
 * 1. Tính toán chính xác theo từng loại tài sản
 * 2. Ưu tiên thông tin từ database (useful_life_years, depreciation_rate)
 * 3. Xử lý đúng các trường hợp đặc biệt (công cụ dụng cụ, thiết bị chuyên dùng)
 * 4. Kết nối hoàn hảo với database
 */

import AssetCategory from '../models/AssetCategory';
import Asset from '../models/Asset';

/**
 * Công cụ dụng cụ — theo **năm dương lịch** (năm của máy chủ khi gọi API):
 * - `delta = năm hiện tại − năm đưa vào sử dụng` (chỉ so sánh số năm, không dùng ngày tháng cụ thể).
 * - Năm đưa vào sử dụng (delta = 0): giữ **nguyên giá**.
 * - Từ năm sau (delta >= 1): **GTCL = 0** (phân bổ 100% trong năm đầu).
 * Ví dụ: đưa vào SD **2025** → năm 2025 nguyên giá; **từ 2026** GTCL = 0.
 */
const TOOLS_FULL_VALUE_MAX_YEARS = 0;

/** Dùng khi đã JOIN sẵn asset_categories (tránh N+1 query trên API danh sách) */
export interface DepreciationPrecachedCategory {
    code: string;
    name: string;
    category_group: string;
    is_depreciable: boolean;
    useful_life_years: number | null;
    depreciation_rate: number | null;
    description?: string | null;
}

export interface DepreciationCalculationInput {
    // Thông tin tài sản
    assetId?: number;
    categoryCode?: string;
    originalValue: number;
    yearInUse?: number; // CHỈ DÙNG năm đưa vào sử dụng, không dùng purchaseDate

    /** Nếu có: bỏ qua AssetCategory.findOne (đồng bộ với JOIN trên list API) */
    precachedCategory?: DepreciationPrecachedCategory;

    // Override từ database hoặc người dùng
    customUsefulLife?: number;
    customDepreciationRate?: number;
    isDepreciable?: boolean;
}

export interface DepreciationCalculationResult {
    // Thông tin cơ bản
    originalValue: number;
    isDepreciable: boolean;

    // Thông tin khấu hao
    usefulLifeYears: number;
    depreciationRate: number; // %/năm
    annualDepreciationAmount: number; // VND/năm

    // Thông tin tính toán
    yearsUsed: number;
    accumulatedDepreciation: number;
    remainingValue: number;
    remainingUsefulLife: number;
    isFullyDepreciated: boolean;

    // Metadata
    categoryInfo?: {
        code: string;
        name: string;
        categoryGroup: string;
    };
    calculationMethod: 'database' | 'custom' | 'regulation';
    calculationNotes?: string;
}

class DepreciationCalculatorService {
    private tryEarlyDepreciationExit(
        input: DepreciationCalculationInput
    ): DepreciationCalculationResult | null {
        if (!input.yearInUse && (!input.originalValue || input.originalValue <= 0)) {
            return {
                originalValue: 0,
                isDepreciable: false,
                usefulLifeYears: 0,
                depreciationRate: 0,
                annualDepreciationAmount: 0,
                yearsUsed: 0,
                accumulatedDepreciation: 0,
                remainingValue: 1,
                remainingUsefulLife: 0,
                isFullyDepreciated: false,
                calculationMethod: 'regulation',
                calculationNotes: 'Không có năm đưa vào sử dụng và nguyên giá - mặc định giá trị còn lại = 1'
            };
        }

        if (!input.yearInUse || input.yearInUse <= 0) {
            const originalValue = input.originalValue && input.originalValue > 0 ? input.originalValue : 1;
            return {
                originalValue,
                isDepreciable: false,
                usefulLifeYears: 0,
                depreciationRate: 0,
                annualDepreciationAmount: 0,
                yearsUsed: 0,
                accumulatedDepreciation: 0,
                remainingValue: originalValue,
                remainingUsefulLife: 0,
                isFullyDepreciated: false,
                calculationMethod: 'regulation',
                calculationNotes: 'Không có năm đưa vào sử dụng - không tính khấu hao'
            };
        }

        if (!input.originalValue || input.originalValue <= 0) {
            const yearsUsed = this.calculateYearsUsedFromYearInUse(input.yearInUse);
            return {
                originalValue: 0,
                isDepreciable: input.isDepreciable || false,
                usefulLifeYears: 0,
                depreciationRate: 0,
                annualDepreciationAmount: 0,
                yearsUsed,
                accumulatedDepreciation: 0,
                remainingValue: 1,
                remainingUsefulLife: 0,
                isFullyDepreciated: false,
                calculationMethod: 'regulation',
                calculationNotes: 'Không có nguyên giá - Giá trị còn lại luôn luôn là 1'
            };
        }

        return null;
    }

    private precachedToCategoryRow(pc: DepreciationPrecachedCategory): any {
        return {
            code: pc.code,
            name: pc.name,
            category_group: pc.category_group,
            is_depreciable: pc.is_depreciable,
            useful_life_years: pc.useful_life_years,
            depreciation_rate: pc.depreciation_rate != null ? Number(pc.depreciation_rate) : null,
            description: pc.description ?? undefined,
        };
    }

    /**
     * Phần tính toán sau khi đã có (hoặc không có) một dòng danh mục — chạy đồng bộ.
     */
    private runDepreciationFromCategoryRow(
        input: DepreciationCalculationInput,
        categoryInfo: any | null
    ): DepreciationCalculationResult {
        let usefulLifeYears: number | null = null;
        let depreciationRate: number | null = null;
        let isDepreciable = true;
        let calculationMethod: 'database' | 'custom' | 'regulation' = 'regulation';
        let calculationNotes = '';

        if (categoryInfo) {
            isDepreciable = categoryInfo.is_depreciable;
            usefulLifeYears = categoryInfo.useful_life_years;
            depreciationRate =
                categoryInfo.depreciation_rate != null ? Number(categoryInfo.depreciation_rate) : null;
            calculationMethod = 'database';
            calculationNotes = categoryInfo.description || '';
        }

        if (input.customUsefulLife !== undefined && input.customUsefulLife !== null) {
            usefulLifeYears = input.customUsefulLife;
            calculationMethod = 'custom';
            calculationNotes = 'Sử dụng thời gian khấu hao tùy chỉnh';
        }

        if (input.customDepreciationRate !== undefined && input.customDepreciationRate !== null) {
            depreciationRate = input.customDepreciationRate;
            calculationMethod = 'custom';
            calculationNotes = 'Sử dụng tỷ lệ khấu hao tùy chỉnh';
        }

        if (input.isDepreciable !== undefined) {
            isDepreciable = input.isDepreciable;
        }

        if (!isDepreciable) {
            const yearsUsed = this.calculateYearsUsedFromYearInUse(input.yearInUse);
            const original =
                input.originalValue && input.originalValue > 0 ? input.originalValue : 1;
            const overToolsLimit = yearsUsed > TOOLS_FULL_VALUE_MAX_YEARS;
            const remainingValue = overToolsLimit ? 0 : original;
            const accumulatedDepreciation = overToolsLimit && input.originalValue > 0
                ? input.originalValue
                : 0;

            return {
                originalValue: input.originalValue,
                isDepreciable: false,
                usefulLifeYears: 0,
                depreciationRate: 0,
                annualDepreciationAmount: 0,
                yearsUsed,
                accumulatedDepreciation,
                remainingValue,
                remainingUsefulLife: 0,
                isFullyDepreciated: overToolsLimit,
                categoryInfo: categoryInfo ? {
                    code: categoryInfo.code,
                    name: categoryInfo.name,
                    categoryGroup: categoryInfo.category_group
                } : undefined,
                calculationMethod,
                calculationNotes: overToolsLimit
                    ? `Công cụ dụng cụ: năm hiện tại > năm SD — GTCL = 0 (phân bổ 100% năm đầu)`
                    : `Công cụ dụng cụ: năm đưa vào SD vẫn nguyên giá`,
            };
        }

        if (categoryInfo?.code === '0504' && !usefulLifeYears && !depreciationRate) {
            throw new Error(
                'Máy móc, thiết bị chuyên dùng cần phải có thời gian sử dụng theo quy định pháp luật có liên quan. ' +
                'Vui lòng nhập thời gian sử dụng hoặc tỷ lệ khấu hao.'
            );
        }

        if (usefulLifeYears && !depreciationRate) {
            depreciationRate = this.calculateDepreciationRateFromUsefulLife(usefulLifeYears);
        }

        if (depreciationRate && !usefulLifeYears) {
            usefulLifeYears = this.calculateUsefulLifeFromRate(depreciationRate);
        }

        if (!usefulLifeYears || !depreciationRate) {
            usefulLifeYears = 5;
            depreciationRate = 20;
            calculationMethod = 'regulation';
            calculationNotes = 'Sử dụng giá trị mặc định: 5 năm - 20%/năm';
        }

        const yearsUsed = this.calculateYearsUsedFromYearInUse(input.yearInUse);
        const annualDepreciationAmount = this.calculateAnnualDepreciation(
            input.originalValue,
            usefulLifeYears
        );
        let accumulatedDepreciation = this.calculateAccumulatedDepreciation(
            annualDepreciationAmount,
            yearsUsed,
            usefulLifeYears
        );
        let remainingValue = Math.max(0, input.originalValue - accumulatedDepreciation);
        const remainingUsefulLife = Math.max(0, usefulLifeYears - yearsUsed);
        const isFullyDepreciated = yearsUsed >= usefulLifeYears;

        if (isFullyDepreciated) {
            remainingValue = 0;
            accumulatedDepreciation = input.originalValue;
        }

        return {
            originalValue: input.originalValue,
            isDepreciable: true,
            usefulLifeYears,
            depreciationRate: Math.round(depreciationRate * 100) / 100,
            annualDepreciationAmount,
            yearsUsed,
            accumulatedDepreciation,
            remainingValue,
            remainingUsefulLife,
            isFullyDepreciated,
            categoryInfo: categoryInfo ? {
                code: categoryInfo.code,
                name: categoryInfo.name,
                categoryGroup: categoryInfo.category_group
            } : undefined,
            calculationMethod,
            calculationNotes
        };
    }

    /**
     * List API: không await, không query DB (truyền precachedCategory hoặc để null).
     */
    calculateDepreciationSync(input: DepreciationCalculationInput): DepreciationCalculationResult {
        const early = this.tryEarlyDepreciationExit(input);
        if (early) return early;

        let categoryInfo: any = null;
        if (input.precachedCategory) {
            categoryInfo = this.precachedToCategoryRow(input.precachedCategory);
        }

        return this.runDepreciationFromCategoryRow(input, categoryInfo);
    }

    /**
     * Tính toán khấu hao cho một tài sản
     * CHỈ DỰA VÀO NĂM ĐƯA VÀO SỬ DỤNG (yearInUse)
     * Nếu không có yearInUse và purchase_price thì không tính khấu hao, giá trị = 1
     */
    async calculateDepreciation(
        input: DepreciationCalculationInput
    ): Promise<DepreciationCalculationResult> {
        const early = this.tryEarlyDepreciationExit(input);
        if (early) return early;

        let categoryInfo: any = null;
        if (input.precachedCategory) {
            categoryInfo = this.precachedToCategoryRow(input.precachedCategory);
        } else if (input.categoryCode) {
            categoryInfo = await AssetCategory.findOne({
                where: { code: input.categoryCode, is_active: true },
                attributes: ['code', 'name', 'category_group', 'is_depreciable', 'useful_life_years', 'depreciation_rate', 'description']
            });
        }

        return this.runDepreciationFromCategoryRow(input, categoryInfo);
    }

    /**
     * Tính toán khấu hao cho nhiều tài sản
     */
    async calculateBulkDepreciation(
        inputs: DepreciationCalculationInput[]
    ): Promise<DepreciationCalculationResult[]> {
        const results: DepreciationCalculationResult[] = [];

        for (const input of inputs) {
            const result = await this.calculateDepreciation(input);
            results.push(result);
        }

        return results;
    }

    /**
     * Cập nhật thông tin khấu hao cho tài sản trong database
     */
    async updateAssetDepreciation(assetId: number): Promise<DepreciationCalculationResult> {
        const asset = await Asset.findByPk(assetId, {
            include: [{
                model: AssetCategory,
                as: 'assetCategory',
                attributes: ['code', 'name', 'category_group', 'is_depreciable', 'useful_life_years', 'depreciation_rate']
            }]
        });

        if (!asset) {
            throw new Error(`Không tìm thấy tài sản với ID: ${assetId}`);
        }

        const category = (asset as any).assetCategory;

        const result = await this.calculateDepreciation({
            assetId,
            categoryCode: asset.category_code || category?.code,
            originalValue: asset.purchase_price || 0,
            yearInUse: asset.year_in_use, // CHỈ DÙNG year_in_use, không dùng purchase_date
            customUsefulLife: asset.useful_life,
            customDepreciationRate: asset.depreciation_rate,
            isDepreciable: asset.is_depreciable !== undefined ? asset.is_depreciable : category?.is_depreciable
        });

        // Cập nhật vào database
        await asset.update({
            current_value: result.remainingValue,
            residual_value: result.remainingValue,
            depreciation_rate: result.depreciationRate,
            useful_life: result.usefulLifeYears,
            accumulated_depreciation: result.accumulatedDepreciation,
            depreciation_last_updated: new Date(),
        });

        return result;
    }

    /**
     * Chênh lệch năm dương lịch: `năm hiện tại − năm đưa vào sử dụng`.
     * Dùng cho cả tài sản khấu hao tuyến tính và quy tắc công cụ dụng cụ (3 năm giữ nguyên giá).
     */
    private calculateYearsUsedFromYearInUse(yearInUse?: number): number {
        if (!yearInUse || yearInUse <= 0) {
            return 0;
        }

        const currentYear = new Date().getFullYear();
        const yearsUsed = currentYear - yearInUse;

        return Math.max(0, yearsUsed);
    }

    /**
     * Tính mức khấu hao hằng năm
     * Công thức: Nguyên giá / Thời gian sử dụng
     */
    private calculateAnnualDepreciation(originalValue: number, usefulLife: number): number {
        if (usefulLife <= 0 || originalValue <= 0) return 0;
        return Math.round(originalValue / usefulLife);
    }

    /**
     * Tính số hao mòn lũy kế
     */
    private calculateAccumulatedDepreciation(
        annualDepreciation: number,
        yearsUsed: number,
        usefulLife: number
    ): number {
        if (yearsUsed <= 0) return 0;

        const effectiveYears = Math.min(yearsUsed, usefulLife);
        return annualDepreciation * effectiveYears;
    }

    /**
     * Tính tỷ lệ khấu hao từ thời gian sử dụng
     * Công thức: 100% / Thời gian sử dụng
     */
    private calculateDepreciationRateFromUsefulLife(usefulLife: number): number {
        if (usefulLife <= 0) return 0;
        return 100 / usefulLife;
    }

    /**
     * Tính thời gian sử dụng từ tỷ lệ khấu hao
     * Công thức: 100% / Tỷ lệ khấu hao
     */
    private calculateUsefulLifeFromRate(rate: number): number {
        if (rate <= 0) return 0;
        return Math.round(100 / rate);
    }

    /**
     * Tạo lịch sử khấu hao theo từng năm
     */
    async generateDepreciationSchedule(
        input: DepreciationCalculationInput
    ): Promise<{
        year: number;
        depreciationAmount: number;
        accumulatedDepreciation: number;
        remainingValue: number;
    }[]> {
        const result = await this.calculateDepreciation(input);

        // Nếu không tính khấu hao hoặc không có năm đưa vào sử dụng, trả về mảng rỗng
        if (!result.isDepreciable || !input.yearInUse) {
            return [];
        }

        // Lịch khấu hao bắt đầu từ năm sau năm đưa vào sử dụng
        const startDepreciationYear = input.yearInUse + 1;
        const schedule: any[] = [];
        let accumulated = 0;

        for (let year = startDepreciationYear; year <= startDepreciationYear + result.usefulLifeYears - 1; year++) {
            let depreciationAmount = result.annualDepreciationAmount;

            // Năm cuối cùng tính số còn lại để đảm bảo về 0
            if (year === startDepreciationYear + result.usefulLifeYears - 1) {
                depreciationAmount = result.originalValue - accumulated;
            }

            accumulated += depreciationAmount;
            const remainingValue = Math.max(0, result.originalValue - accumulated);

            schedule.push({
                year,
                depreciationAmount,
                accumulatedDepreciation: accumulated,
                remainingValue
            });
        }

        return schedule;
    }

    /**
     * Validate thông tin khấu hao
     */
    validateDepreciationInput(input: DepreciationCalculationInput): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (!input.originalValue || input.originalValue <= 0) {
            errors.push('Nguyên giá phải lớn hơn 0');
        }

        if (input.customUsefulLife !== undefined && input.customUsefulLife < 0) {
            errors.push('Thời gian sử dụng không được âm');
        }

        if (input.customDepreciationRate !== undefined &&
            (input.customDepreciationRate < 0 || input.customDepreciationRate > 100)) {
            errors.push('Tỷ lệ khấu hao phải từ 0-100%');
        }

        if (input.yearInUse && input.yearInUse > new Date().getFullYear()) {
            errors.push('Năm đưa vào sử dụng không được lớn hơn năm hiện tại');
        }

        // Kiểm tra bắt buộc: phải có năm đưa vào sử dụng và nguyên giá để tính khấu hao
        if (!input.yearInUse && (!input.originalValue || input.originalValue <= 0)) {
            // Trường hợp này hợp lệ - sẽ không tính khấu hao, giá trị = 1
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default new DepreciationCalculatorService();
