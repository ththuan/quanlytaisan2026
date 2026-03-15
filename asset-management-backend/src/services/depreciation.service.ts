/**
 * Depreciation Service
 * Tính khấu hao và hao mòn tài sản theo quy định
 * Dựa theo Thông tư số 141/2025/TT-BTC ngày 31/12/2025 của Bộ Tài chính
 * 
 * Công thức:
 * - Mức hao mòn hằng năm = Nguyên giá × Tỷ lệ hao mòn (% năm)
 * - Tỷ lệ hao mòn = 100% / Thời gian sử dụng (năm)
 * - Giá trị còn lại = Nguyên giá - Số hao mòn lũy kế
 * 
 * QUAN TRỌNG: Công cụ dụng cụ (tools) KHÔNG tính khấu hao
 */

// ===== PHÂN LOẠI TÀI SẢN THEO THÔNG TƯ 141/2025/TT-BTC =====

// Loại I: Nhà, công trình xây dựng
export const BUILDING_CATEGORIES = [
  'building', 'building_special', 'building_grade1', 'building_grade2', 
  'building_grade3', 'building_grade4', 'nha_cap_1', 'nha_cap_2', 
  'nha_cap_3', 'nha_cap_4', 'biet_thu', 'nha_van_phong'
];

// Loại II: Vật kiến trúc
export const STRUCTURE_CATEGORIES = [
  'structure', 'structure_storage', 'structure_fence', 'kho_chua', 
  'be_chua', 'bai_do', 'san_phoi', 'san_the_thao', 'be_boi', 
  'cong_trinh_dien', 'gieng_khoan', 'gieng_dao', 'tuong_rao', 'vat_kien_truc'
];

// Loại III: Xe ô tô
export const CAR_CATEGORIES = [
  'car', 'xe_oto', 'xe_o_to', 'oto', 'o_to', 'vehicle_car'
];

// Loại IV: Phương tiện vận tải khác
export const VEHICLE_CATEGORIES = [
  'vehicle', 'motorcycle', 'xe_may', 'phuong_tien_van_tai', 
  'xe_dap', 'xe_chuyen_dung', 'xe_tai', 'xe_bus'
];

// Loại V: Máy móc, thiết bị
export const EQUIPMENT_CATEGORIES = [
  'equipment', 'furniture', 'appliance', 'electronics', 'computer', 
  'laptop', 'printer', 'air_conditioner', 'equipment_other',
  'may_tinh', 'may_in', 'may_scan', 'may_photocopy', 'dieu_hoa',
  'ban_ghe', 'tu_tai_lieu', 'may_bom_nuoc', 'thang_may', 'ket_sat',
  'may_moc', 'thiet_bi', 'thiet_bi_chuyen_dung'
];

// Loại VI: Tài sản cố định hữu hình khác
export const OTHER_TANGIBLE_CATEGORIES = [
  'other_tangible', 'fixed_asset', 'project_asset', 'tai_san_khac'
];

// CÔNG CỤ DỤNG CỤ - KHÔNG TÍNH KHẤU HAO
export const TOOLS_CATEGORIES = [
  'tools', 'cong_cu', 'dung_cu', 'cong_cu_dung_cu', 'vat_tu_tieu_hao'
];

// Bảng thời gian sử dụng để tính hao mòn theo loại tài sản (năm)
// Dựa theo Phụ lục I Thông tư 141/2025/TT-BTC
export const DEPRECIATION_RATES: Record<string, { usefulLife: number; rate: number; description: string; category_group: string }> = {
  // ===== I. NHÀ, CÔNG TRÌNH XÂY DỰNG (Phụ lục I - Mục I) =====
  'building': {
    usefulLife: 25, // Trung bình cấp III
    rate: 4,
    description: 'Nhà, công trình xây dựng (25 năm - 4%/năm)',
    category_group: 'building'
  },
  'building_special': {
    usefulLife: 80,
    rate: 1.25,
    description: 'Biệt thự, công trình xây dựng cấp đặc biệt (80 năm - 1.25%/năm)',
    category_group: 'building'
  },
  'building_grade1': {
    usefulLife: 80,
    rate: 1.25,
    description: 'Nhà cấp I (80 năm - 1.25%/năm)',
    category_group: 'building'
  },
  'nha_cap_1': {
    usefulLife: 80,
    rate: 1.25,
    description: 'Nhà cấp I (80 năm - 1.25%/năm)',
    category_group: 'building'
  },
  'building_grade2': {
    usefulLife: 50,
    rate: 2,
    description: 'Nhà cấp II (50 năm - 2%/năm)',
    category_group: 'building'
  },
  'nha_cap_2': {
    usefulLife: 50,
    rate: 2,
    description: 'Nhà cấp II (50 năm - 2%/năm)',
    category_group: 'building'
  },
  'building_grade3': {
    usefulLife: 25,
    rate: 4,
    description: 'Nhà cấp III (25 năm - 4%/năm)',
    category_group: 'building'
  },
  'nha_cap_3': {
    usefulLife: 25,
    rate: 4,
    description: 'Nhà cấp III (25 năm - 4%/năm)',
    category_group: 'building'
  },
  'building_grade4': {
    usefulLife: 15,
    rate: 6.67,
    description: 'Nhà cấp IV (15 năm - 6.67%/năm)',
    category_group: 'building'
  },
  'nha_cap_4': {
    usefulLife: 15,
    rate: 6.67,
    description: 'Nhà cấp IV (15 năm - 6.67%/năm)',
    category_group: 'building'
  },
  'biet_thu': {
    usefulLife: 80,
    rate: 1.25,
    description: 'Biệt thự (80 năm - 1.25%/năm)',
    category_group: 'building'
  },

  // ===== II. VẬT KIẾN TRÚC (Phụ lục I - Mục II) =====
  'structure': {
    usefulLife: 10, // Mặc định
    rate: 10,
    description: 'Vật kiến trúc (10 năm - 10%/năm)',
    category_group: 'structure'
  },
  'structure_storage': {
    usefulLife: 20,
    rate: 5,
    description: 'Kho chứa, bể chứa, bãi đỗ, sân phơi, sân thể thao, bể bơi, công trình điện (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'kho_chua': {
    usefulLife: 20,
    rate: 5,
    description: 'Kho chứa (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'be_chua': {
    usefulLife: 20,
    rate: 5,
    description: 'Bể chứa (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'bai_do': {
    usefulLife: 20,
    rate: 5,
    description: 'Bãi đỗ (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'san_the_thao': {
    usefulLife: 20,
    rate: 5,
    description: 'Sân thể thao (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'be_boi': {
    usefulLife: 20,
    rate: 5,
    description: 'Bể bơi (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'cong_trinh_dien': {
    usefulLife: 20,
    rate: 5,
    description: 'Công trình điện (20 năm - 5%/năm)',
    category_group: 'structure'
  },
  'structure_fence': {
    usefulLife: 10,
    rate: 10,
    description: 'Giếng khoan, giếng đào, tường rào và vật kiến trúc khác (10 năm - 10%/năm)',
    category_group: 'structure'
  },
  'gieng_khoan': {
    usefulLife: 10,
    rate: 10,
    description: 'Giếng khoan (10 năm - 10%/năm)',
    category_group: 'structure'
  },
  'tuong_rao': {
    usefulLife: 10,
    rate: 10,
    description: 'Tường rào (10 năm - 10%/năm)',
    category_group: 'structure'
  },

  // ===== III. XE Ô TÔ (Phụ lục I - Mục III) =====
  'car': {
    usefulLife: 15,
    rate: 6.67,
    description: 'Xe ô tô (15 năm - 6.67%/năm)',
    category_group: 'car'
  },
  'xe_oto': {
    usefulLife: 15,
    rate: 6.67,
    description: 'Xe ô tô (15 năm - 6.67%/năm)',
    category_group: 'car'
  },
  'xe_o_to': {
    usefulLife: 15,
    rate: 6.67,
    description: 'Xe ô tô (15 năm - 6.67%/năm)',
    category_group: 'car'
  },

  // ===== IV. PHƯƠNG TIỆN VẬN TẢI KHÁC (Phụ lục I - Mục IV) =====
  'vehicle': {
    usefulLife: 10,
    rate: 10,
    description: 'Phương tiện vận tải khác (10 năm - 10%/năm)',
    category_group: 'vehicle'
  },
  'motorcycle': {
    usefulLife: 10,
    rate: 10,
    description: 'Xe máy (10 năm - 10%/năm)',
    category_group: 'vehicle'
  },
  'xe_may': {
    usefulLife: 10,
    rate: 10,
    description: 'Xe máy (10 năm - 10%/năm)',
    category_group: 'vehicle'
  },
  'phuong_tien_van_tai': {
    usefulLife: 10,
    rate: 10,
    description: 'Phương tiện vận tải khác (10 năm - 10%/năm)',
    category_group: 'vehicle'
  },

  // ===== V. MÁY MÓC, THIẾT BỊ (Phụ lục I - Mục V) =====
  // Nhóm 1: Bàn ghế, thang máy, két sắt - 10 năm
  'furniture': {
    usefulLife: 10,
    rate: 10,
    description: 'Bộ bàn ghế ngồi làm việc, bàn ghế họp, tiếp khách, thang máy, két sắt (10 năm - 10%/năm)',
    category_group: 'equipment'
  },
  'ban_ghe': {
    usefulLife: 10,
    rate: 10,
    description: 'Bàn ghế (10 năm - 10%/năm)',
    category_group: 'equipment'
  },
  'thang_may': {
    usefulLife: 10,
    rate: 10,
    description: 'Thang máy (10 năm - 10%/năm)',
    category_group: 'equipment'
  },
  'ket_sat': {
    usefulLife: 10,
    rate: 10,
    description: 'Két sắt (10 năm - 10%/năm)',
    category_group: 'equipment'
  },

  // Nhóm 2: Tủ, điều hòa, máy bơm nước - 8 năm
  'appliance': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Tủ đựng tài liệu, máy điều hòa không khí, máy bơm nước, bàn ghế hội trường, phòng ăn (8 năm - 12.5%/năm)',
    category_group: 'equipment'
  },
  'tu_tai_lieu': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Tủ đựng tài liệu (8 năm - 12.5%/năm)',
    category_group: 'equipment'
  },
  'air_conditioner': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Máy điều hòa không khí (8 năm - 12.5%/năm)',
    category_group: 'equipment'
  },
  'dieu_hoa': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Điều hòa (8 năm - 12.5%/năm)',
    category_group: 'equipment'
  },
  'may_bom_nuoc': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Máy bơm nước (8 năm - 12.5%/năm)',
    category_group: 'equipment'
  },

  // Nhóm 3: Máy vi tính, máy in, máy scan, điện thoại - 7 năm
  'electronics': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy vi tính để bàn, xách tay, máy in, điện thoại cố định, máy scan, máy photocopy (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'computer': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy vi tính (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'may_tinh': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy vi tính (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'laptop': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Laptop (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'printer': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy in (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'may_in': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy in (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'may_scan': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy scan (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'may_photocopy': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy photocopy (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'dien_thoai': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Điện thoại cố định (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },
  'may_huy_tai_lieu': {
    usefulLife: 7,
    rate: 14.29,
    description: 'Máy hủy tài liệu (7 năm - 14.29%/năm)',
    category_group: 'equipment'
  },

  // Nhóm 4: Máy móc, thiết bị khác - 5 năm
  'equipment': {
    usefulLife: 5, // Mặc định máy móc khác
    rate: 20,
    description: 'Máy móc, thiết bị khác (5 năm - 20%/năm)',
    category_group: 'equipment'
  },
  'equipment_other': {
    usefulLife: 5,
    rate: 20,
    description: 'Máy móc, thiết bị khác (5 năm - 20%/năm)',
    category_group: 'equipment'
  },
  'may_moc': {
    usefulLife: 5,
    rate: 20,
    description: 'Máy móc (5 năm - 20%/năm)',
    category_group: 'equipment'
  },
  'thiet_bi': {
    usefulLife: 5,
    rate: 20,
    description: 'Thiết bị (5 năm - 20%/năm)',
    category_group: 'equipment'
  },
  'thiet_bi_chuyen_dung': {
    usefulLife: 5,
    rate: 20,
    description: 'Thiết bị chuyên dùng (5 năm - 20%/năm)',
    category_group: 'equipment'
  },

  // ===== VI. TÀI SẢN CỐ ĐỊNH HỮU HÌNH KHÁC (Phụ lục I - Mục VI) =====
  'other_tangible': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Tài sản cố định hữu hình khác (8 năm - 12.5%/năm)',
    category_group: 'other_tangible'
  },
  'fixed_asset': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Tài sản cố định (8 năm - 12.5%/năm)',
    category_group: 'other_tangible'
  },
  'project_asset': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Tài sản dự án (8 năm - 12.5%/năm)',
    category_group: 'other_tangible'
  },
  'tai_san_khac': {
    usefulLife: 8,
    rate: 12.5,
    description: 'Tài sản khác (8 năm - 12.5%/năm)',
    category_group: 'other_tangible'
  },
  'software': {
    usefulLife: 5,
    rate: 20,
    description: 'Phần mềm (5 năm - 20%/năm)',
    category_group: 'other_tangible'
  },
  'other': {
    usefulLife: 5,
    rate: 20,
    description: 'Tài sản khác (5 năm - 20%/năm)',
    category_group: 'other_tangible'
  },

  // ===== CÔNG CỤ DỤNG CỤ - KHÔNG TÍNH KHẤU HAO =====
  'tools': {
    usefulLife: 0, // 0 = không tính khấu hao
    rate: 0,
    description: 'Công cụ dụng cụ (KHÔNG tính khấu hao)',
    category_group: 'tools'
  },
  'cong_cu': {
    usefulLife: 0,
    rate: 0,
    description: 'Công cụ (KHÔNG tính khấu hao)',
    category_group: 'tools'
  },
  'dung_cu': {
    usefulLife: 0,
    rate: 0,
    description: 'Dụng cụ (KHÔNG tính khấu hao)',
    category_group: 'tools'
  },
  'cong_cu_dung_cu': {
    usefulLife: 0,
    rate: 0,
    description: 'Công cụ dụng cụ (KHÔNG tính khấu hao)',
    category_group: 'tools'
  },
  'vat_tu_tieu_hao': {
    usefulLife: 0,
    rate: 0,
    description: 'Vật tư tiêu hao (KHÔNG tính khấu hao)',
    category_group: 'tools'
  },
};

// Danh mục không tính khấu hao (Công cụ dụng cụ)
export const NON_DEPRECIABLE_CATEGORIES = TOOLS_CATEGORIES;

export interface DepreciationInfo {
  // Nguyên giá
  originalValue: number;
  // Thời gian sử dụng để tính hao mòn (năm)
  usefulLife: number;
  // Tỷ lệ hao mòn hằng năm (%)
  annualDepreciationRate: number;
  // Mức hao mòn hằng năm (VND)
  annualDepreciationAmount: number;
  // Số năm đã sử dụng
  yearsUsed: number;
  // Số hao mòn lũy kế
  accumulatedDepreciation: number;
  // Giá trị còn lại
  currentValue: number;
  // Thời gian sử dụng còn lại (năm)
  remainingUsefulLife: number;
  // Đã khấu hao hết chưa
  isFullyDepreciated: boolean;
  // Có tính khấu hao không
  isDepreciable: boolean;
}

export interface DepreciationHistory {
  year: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  remainingValue: number;
}

class DepreciationService {
  /**
   * Kiểm tra danh mục có tính khấu hao không
   */
  isDepreciable(category?: string): boolean {
    if (!category) return true;
    return !NON_DEPRECIABLE_CATEGORIES.includes(category);
  }

  /**
   * Lấy thời gian sử dụng theo loại tài sản
   */
  getUsefulLife(category?: string, assetType?: string): number {
    // Nếu là danh mục không tính khấu hao
    if (category && NON_DEPRECIABLE_CATEGORIES.includes(category)) {
      return 0;
    }

    // Ưu tiên theo loại tài sản cụ thể
    if (assetType) {
      const normalizedType = assetType.toLowerCase().replace(/\s+/g, '_');
      if (DEPRECIATION_RATES[normalizedType]) {
        return DEPRECIATION_RATES[normalizedType].usefulLife;
      }
    }
    
    // Theo danh mục
    if (category && DEPRECIATION_RATES[category]) {
      return DEPRECIATION_RATES[category].usefulLife;
    }
    
    // Mặc định 5 năm
    return 5;
  }

  /**
   * Tính tỷ lệ hao mòn hằng năm
   */
  calculateAnnualDepreciationRate(usefulLife: number): number {
    if (usefulLife <= 0) return 0;
    return 100 / usefulLife;
  }

  /**
   * Tính mức hao mòn hằng năm
   */
  calculateAnnualDepreciation(originalValue: number, usefulLife: number): number {
    if (usefulLife <= 0 || originalValue <= 0) return 0;
    return Math.round(originalValue / usefulLife);
  }

  /**
   * Tính số năm đã sử dụng
   * Ưu tiên: year_in_use > purchase_date
   */
  calculateYearsUsed(purchaseDate?: Date | string, yearInUse?: number): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Ưu tiên sử dụng year_in_use nếu có
    if (yearInUse && yearInUse > 0) {
      const yearsUsed = currentYear - yearInUse;
      // Nếu trong cùng năm thì tính là 1 năm
      return yearsUsed <= 0 ? 1 : yearsUsed;
    }
    
    // Fallback về purchase_date nếu có
    if (purchaseDate) {
      const purchase = new Date(purchaseDate);
      const purchaseYear = purchase.getFullYear();
      
      // Nếu trong cùng năm thì tính là 1 năm
      if (currentYear === purchaseYear) return 1;
      
      return currentYear - purchaseYear;
    }
    
    return 0;
  }

  /**
   * Tính số hao mòn lũy kế
   */
  calculateAccumulatedDepreciation(
    originalValue: number,
    usefulLife: number,
    yearsUsed: number
  ): number {
    if (yearsUsed <= 0 || originalValue <= 0 || usefulLife <= 0) return 0;
    
    const annualDepreciation = this.calculateAnnualDepreciation(originalValue, usefulLife);
    const effectiveYears = Math.min(yearsUsed, usefulLife);
    
    return annualDepreciation * effectiveYears;
  }

  /**
   * Tính giá trị còn lại
   */
  calculateRemainingValue(
    originalValue: number,
    accumulatedDepreciation: number
  ): number {
    const remaining = originalValue - accumulatedDepreciation;
    return Math.max(0, remaining);
  }

  /**
   * Tính toán đầy đủ thông tin khấu hao cho một tài sản
   * 
   * Ưu tiên sử dụng:
   * 1. customUsefulLife (từ asset.useful_life hoặc category.useful_life_years)
   * 2. customDepreciationRate (từ asset.depreciation_rate hoặc category.depreciation_rate)
   * 3. Tra cứu trong DEPRECIATION_RATES theo category/assetType
   */
  calculateDepreciation(
    originalValue: number,
    purchaseDate?: Date | string,
    category?: string,
    assetType?: string,
    customUsefulLife?: number,
    yearInUse?: number,
    customDepreciationRate?: number,
    isDepreciableFlag?: boolean
  ): DepreciationInfo {
    // Kiểm tra có tính khấu hao không
    // Ưu tiên: isDepreciableFlag (từ database) > isDepreciable(category)
    const isDepreciable = isDepreciableFlag !== undefined 
      ? isDepreciableFlag 
      : this.isDepreciable(category);
    
    // Nếu không tính khấu hao (công cụ dụng cụ)
    if (!isDepreciable) {
      return {
        originalValue,
        usefulLife: 0,
        annualDepreciationRate: 0,
        annualDepreciationAmount: 0,
        yearsUsed: this.calculateYearsUsed(purchaseDate, yearInUse),
        accumulatedDepreciation: 0,
        currentValue: originalValue, // Giữ nguyên giá trị
        remainingUsefulLife: 0,
        isFullyDepreciated: false,
        isDepreciable: false,
      };
    }
    
    // Xác định thời gian sử dụng
    // Ưu tiên: customUsefulLife (từ database) > tra cứu trong DEPRECIATION_RATES
    let usefulLife = customUsefulLife;
    if (!usefulLife || usefulLife <= 0) {
      usefulLife = this.getUsefulLife(category, assetType);
    }
    
    // Xác định tỷ lệ khấu hao
    // Ưu tiên: customDepreciationRate (từ database) > tính từ usefulLife
    let annualDepreciationRate: number;
    if (customDepreciationRate && customDepreciationRate > 0) {
      annualDepreciationRate = customDepreciationRate;
    } else {
      annualDepreciationRate = this.calculateAnnualDepreciationRate(usefulLife);
    }
    
    // Tính các giá trị
    const annualDepreciationAmount = this.calculateAnnualDepreciation(originalValue, usefulLife);
    const yearsUsed = this.calculateYearsUsed(purchaseDate, yearInUse);
    const accumulatedDepreciation = this.calculateAccumulatedDepreciation(
      originalValue,
      usefulLife,
      yearsUsed
    );
    const currentValue = this.calculateRemainingValue(originalValue, accumulatedDepreciation);
    const remainingUsefulLife = Math.max(0, usefulLife - yearsUsed);
    const isFullyDepreciated = yearsUsed >= usefulLife;

    return {
      originalValue,
      usefulLife,
      annualDepreciationRate: Math.round(annualDepreciationRate * 100) / 100,
      annualDepreciationAmount,
      yearsUsed,
      accumulatedDepreciation,
      currentValue,
      remainingUsefulLife,
      isFullyDepreciated,
      isDepreciable: true,
    };
  }

  /**
   * Tạo lịch sử khấu hao theo từng năm
   */
  generateDepreciationHistory(
    originalValue: number,
    purchaseDate?: Date | string,
    category?: string,
    assetType?: string,
    customUsefulLife?: number
  ): DepreciationHistory[] {
    if (!purchaseDate || !originalValue) return [];
    
    // Không tạo lịch sử nếu là danh mục không tính khấu hao
    if (!this.isDepreciable(category)) return [];

    const usefulLife = customUsefulLife || this.getUsefulLife(category, assetType);
    const annualDepreciation = this.calculateAnnualDepreciation(originalValue, usefulLife);
    const startYear = new Date(purchaseDate).getFullYear();
    const currentYear = new Date().getFullYear();
    
    const history: DepreciationHistory[] = [];
    let accumulated = 0;

    for (let year = startYear; year <= Math.min(currentYear, startYear + usefulLife - 1); year++) {
      // Năm cuối cùng tính số còn lại
      let depreciation = annualDepreciation;
      if (year === startYear + usefulLife - 1) {
        depreciation = originalValue - accumulated;
      }
      
      accumulated += depreciation;
      const remainingValue = Math.max(0, originalValue - accumulated);

      history.push({
        year,
        depreciationAmount: depreciation,
        accumulatedDepreciation: accumulated,
        remainingValue,
      });
    }

    return history;
  }

  /**
   * Cập nhật giá trị hiện tại của tài sản dựa trên khấu hao
   */
  calculateCurrentValue(
    originalValue: number,
    purchaseDate?: Date | string,
    category?: string,
    assetType?: string
  ): number {
    const info = this.calculateDepreciation(
      originalValue,
      purchaseDate,
      category,
      assetType
    );
    return info.currentValue;
  }
}

export default new DepreciationService();
