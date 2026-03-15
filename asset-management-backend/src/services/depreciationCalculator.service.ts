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

export interface DepreciationCalculationInput {
    // Thông tin tài sản
    assetId?: number;
    categoryCode?: string;
    originalValue: number;
    yearInUse?: number; // CHỈ DÙNG năm đưa vào sử dụng, không dùng purchaseDate

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
    /**
     * Tính toán khấu hao cho một tài sản
     * CHỈ DỰA VÀO NĂM ĐƯA VÀO SỬ DỤNG (yearInUse)
     * Nếu không có yearInUse và purchase_price thì không tính khấu hao, giá trị = 1
     */
    async calculateDepreciation(
        input: DepreciationCalculationInput
    ): Promise<DepreciationCalculationResult> {
        // KIỂM TRA ĐIỀU KIỆN: Nếu không có năm đưa vào sử dụng và nguyên giá
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

        // Nếu không có năm đưa vào sử dụng, không tính khấu hao
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

        // Nếu không có nguyên giá hoặc nguyên giá <= 0, không tính khấu hao
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

        let categoryInfo: any = null;
        let usefulLifeYears: number | null = null;
        let depreciationRate: number | null = null;
        let isDepreciable = true;
        let calculationMethod: 'database' | 'custom' | 'regulation' = 'regulation';
        let calculationNotes = '';

        // BƯỚC 1: Lấy thông tin từ database nếu có categoryCode
        if (input.categoryCode) {
            categoryInfo = await AssetCategory.findOne({
                where: { code: input.categoryCode, is_active: true },
                attributes: ['code', 'name', 'category_group', 'is_depreciable', 'useful_life_years', 'depreciation_rate', 'description']
            });

            if (categoryInfo) {
                isDepreciable = categoryInfo.is_depreciable;
                usefulLifeYears = categoryInfo.useful_life_years;
                depreciationRate = categoryInfo.depreciation_rate;
                calculationMethod = 'database';
                calculationNotes = categoryInfo.description || '';
            }
        }

        // BƯỚC 2: Override bằng custom values nếu có
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

        // BƯỚC 3: Nếu không tính khấu hao (công cụ dụng cụ, tài sản đặc thù)
        if (!isDepreciable) {
            const yearsUsed = this.calculateYearsUsedFromYearInUse(input.yearInUse);

            return {
                originalValue: input.originalValue,
                isDepreciable: false,
                usefulLifeYears: 0,
                depreciationRate: 0,
                annualDepreciationAmount: 0,
                yearsUsed,
                accumulatedDepreciation: 0,
                remainingValue: (input.originalValue && input.originalValue > 0) ? input.originalValue : 1,
                remainingUsefulLife: 0,
                isFullyDepreciated: false,
                categoryInfo: categoryInfo ? {
                    code: categoryInfo.code,
                    name: categoryInfo.name,
                    categoryGroup: categoryInfo.category_group
                } : undefined,
                calculationMethod,
                calculationNotes: 'Tài sản KHÔNG tính khấu hao'
            };
        }

        // BƯỚC 4: Xử lý trường hợp thiết bị chuyên dùng (theo quy định pháp luật)
        if (categoryInfo?.code === '0504' && !usefulLifeYears && !depreciationRate) {
            // Thiết bị chuyên dùng cần có thông tin custom
            throw new Error(
                'Máy móc, thiết bị chuyên dùng cần phải có thời gian sử dụng theo quy định pháp luật có liên quan. ' +
                'Vui lòng nhập thời gian sử dụng hoặc tỷ lệ khấu hao.'
            );
        }

        // BƯỚC 5: Tính toán tỷ lệ khấu hao và thời gian sử dụng
        // Nếu có useful_life_years nhưng không có depreciation_rate
        if (usefulLifeYears && !depreciationRate) {
            depreciationRate = this.calculateDepreciationRateFromUsefulLife(usefulLifeYears);
        }

        // Nếu có depreciation_rate nhưng không có useful_life_years
        if (depreciationRate && !usefulLifeYears) {
            usefulLifeYears = this.calculateUsefulLifeFromRate(depreciationRate);
        }

        // Nếu vẫn không có thông tin, sử dụng mặc định
        if (!usefulLifeYears || !depreciationRate) {
            usefulLifeYears = 5; // Mặc định 5 năm
            depreciationRate = 20; // 20%/năm
            calculationMethod = 'regulation';
            calculationNotes = 'Sử dụng giá trị mặc định: 5 năm - 20%/năm';
        }

        // BƯỚC 6: Tính toán các giá trị khấu hao - CHỈ DỰA VÀO NĂM ĐƯA VÀO SỬ DỤNG
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

        // BẮT BUỘC: Nếu hết khấu hao thì giá trị còn lại phải là 0
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
     * Tính số năm đã sử dụng - CHỈ DỰA VÀO NĂM ĐƯA VÀO SỬ DỤNG
     */
    private calculateYearsUsedFromYearInUse(yearInUse?: number): number {
        if (!yearInUse || yearInUse <= 0) {
            return 0;
        }

        const currentYear = new Date().getFullYear();
        
        // Theo nguyên tắc mới: nhập năm N thì năm N+1 mới bắt đầu tính khấu hao
        // Năm N: yearsUsed = 0
        // Năm N+1: yearsUsed = 1
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
        const currentYear = new Date().getFullYear();
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
