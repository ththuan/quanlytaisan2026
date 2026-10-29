import { Signature } from '../models';
import { ValidationError } from '../utils/errorHandler';
import logger from '../utils/logger';

export interface RecordSignatureInput {
  entityType: string;
  entityId: number;
  action: string;
  signerId: number;
  signerName: string;
  signerRole?: string | null;
  signatureImage: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const MAX_SIGNATURE_LENGTH = 2_000_000; // ~1.5MB base64
const SIGNATURE_DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Kiểm tra chuỗi ảnh chữ ký hợp lệ (chỉ raster data URL, không SVG/HTML). */
export function isValidSignatureImage(input: unknown): input is string {
  return (
    typeof input === 'string' &&
    input.length > 50 &&
    input.length <= MAX_SIGNATURE_LENGTH &&
    SIGNATURE_DATA_URL.test(input)
  );
}

/** Bắt buộc có chữ ký sống — ném lỗi nếu thiếu/không hợp lệ. */
export function assertSignature(input: unknown): string {
  if (!input) {
    throw new ValidationError('Cần ký xác nhận (chữ ký sống) trước khi thực hiện thao tác này');
  }
  if (!isValidSignatureImage(input)) {
    throw new ValidationError('Chữ ký không hợp lệ. Vui lòng ký lại');
  }
  return input;
}

/**
 * Lưu vết một chữ ký sống. Bất biến — chỉ ghi thêm, không sửa/xóa.
 */
export async function recordSignature(input: RecordSignatureInput): Promise<void> {
  try {
    await Signature.create({
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      signer_id: input.signerId,
      signer_name: input.signerName,
      signer_role: input.signerRole ?? null,
      signature_image: input.signatureImage,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      signed_at: new Date(),
    });
  } catch (error) {
    logger.error('Failed to record signature:', error as any);
    throw new ValidationError('Không thể lưu chữ ký. Vui lòng thử lại');
  }
}

/** Danh sách chữ ký của một đối tượng. */
export async function listSignatures(entityType: string, entityId: number): Promise<Signature[]> {
  return Signature.findAll({
    where: { entity_type: entityType, entity_id: entityId },
    order: [['signed_at', 'ASC']],
  });
}

export default {
  isValidSignatureImage,
  assertSignature,
  recordSignature,
  listSignatures,
};
