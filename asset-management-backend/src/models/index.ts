import User from './User';
import Department from './Department';
import Asset, { AssetCondition } from './Asset';
import AssetTransfer from './AssetTransfer';
import MaintenanceRequest from './MaintenanceRequest';
import MaintenanceDamageImage from './MaintenanceDamageImage';
import Procurement from './Procurement';
import ProcurementItem from './ProcurementItem';
import ProcurementDocument from './ProcurementDocument';
import AnnualReport from './AnnualReport';
import AuditLog from './AuditLog';
import RequestApproval from './RequestApproval';
import InventoryRound from './InventoryRound';
import InventoryReport from './InventoryReport';
import InventoryReportDetail from './InventoryReportDetail';
import AssetCategory from './AssetCategory';
import AssetDisposalCase from './AssetDisposalCase';
import AssetDisposalItem from './AssetDisposalItem';

import StockItem from './StockItem';
import StockReceipt from './StockReceipt';
import StockReceiptLine from './StockReceiptLine';
import StockIssue from './StockIssue';
import StockIssueLine from './StockIssueLine';

// Define Model Associations

// AssetCategory <-> Asset
Asset.belongsTo(AssetCategory, {
  foreignKey: 'category_id',
  as: 'assetCategory',
});

AssetCategory.hasMany(Asset, {
  foreignKey: 'category_id',
  as: 'assets',
});

// User <-> Department
User.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

Department.hasMany(User, {
  foreignKey: 'department_id',
  as: 'users',
});

Department.belongsTo(User, {
  foreignKey: 'manager_id',
  as: 'manager',
});

// Department hierarchical relationship
Department.belongsTo(Department, {
  foreignKey: 'parent_department_id',
  as: 'parent_department',
});

Department.hasMany(Department, {
  foreignKey: 'parent_department_id',
  as: 'sub_departments',
});

// Asset <-> Department
Asset.belongsTo(Department, {
  foreignKey: 'current_department_id',
  as: 'current_department',
});

Department.hasMany(Asset, {
  foreignKey: 'current_department_id',
  as: 'assets',
});

// AssetTransfer associations
AssetTransfer.belongsTo(Asset, {
  foreignKey: 'asset_id',
  as: 'asset',
});

Asset.hasMany(AssetTransfer, {
  foreignKey: 'asset_id',
  as: 'transfers',
});

AssetTransfer.belongsTo(Department, {
  foreignKey: 'from_department_id',
  as: 'from_department',
});

AssetTransfer.belongsTo(Department, {
  foreignKey: 'to_department_id',
  as: 'to_department',
});

AssetTransfer.belongsTo(User, {
  foreignKey: 'requested_by',
  as: 'requester',
});

AssetTransfer.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver',
});

// MaintenanceRequest associations
MaintenanceRequest.belongsTo(Asset, {
  foreignKey: 'asset_id',
  as: 'asset',
});

Asset.hasMany(MaintenanceRequest, {
  foreignKey: 'asset_id',
  as: 'maintenance_requests',
});

MaintenanceRequest.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'requested_by',
  as: 'requester',
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver',
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assignee',
});

// AnnualReport associations
AnnualReport.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

Department.hasMany(AnnualReport, {
  foreignKey: 'department_id',
  as: 'annual_reports',
});

AnnualReport.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

AnnualReport.belongsTo(User, {
  foreignKey: 'submitted_by',
  as: 'submitter',
});

AnnualReport.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver',
});

// AuditLog associations
AuditLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(AuditLog, {
  foreignKey: 'user_id',
  as: 'audit_logs',
});

// RequestApproval associations
RequestApproval.belongsTo(User, {
  foreignKey: 'approver_id',
  as: 'approver',
});

User.hasMany(RequestApproval, {
  foreignKey: 'approver_id',
  as: 'approvals',
});

// MaintenanceRequest multi-level approval associations
MaintenanceRequest.belongsTo(User, {
  foreignKey: 'head_approved_by',
  as: 'headApprover',
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'admin_approved_by',
  as: 'adminApprover',
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'director_approved_by',
  as: 'directorApprover',
});

MaintenanceRequest.belongsTo(User, {
  foreignKey: 'rejected_by',
  as: 'rejector',
});

// MaintenanceRequest <-> MaintenanceDamageImage associations
MaintenanceRequest.hasMany(MaintenanceDamageImage, {
  foreignKey: 'maintenance_id',
  as: 'damageImages',
});

MaintenanceDamageImage.belongsTo(MaintenanceRequest, {
  foreignKey: 'maintenance_id',
  as: 'maintenance',
});

// MaintenanceRequest <-> Procurement (linked procurement)
MaintenanceRequest.belongsTo(Procurement, {
  foreignKey: 'linked_procurement_id',
  as: 'linkedProcurement',
});

Procurement.belongsTo(MaintenanceRequest, {
  foreignKey: 'maintenance_request_id',
  as: 'sourceMaintenanceRequest',
});

// Procurement associations (admin-only module)
Procurement.belongsTo(Department, {
  foreignKey: 'receiving_department_id',
  as: 'receiving_department',
});

Procurement.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

Procurement.belongsTo(User, {
  foreignKey: 'fulfilled_by',
  as: 'fulfiller',
});

Procurement.hasMany(ProcurementItem, {
  foreignKey: 'procurement_id',
  as: 'items',
});

ProcurementItem.belongsTo(Procurement, {
  foreignKey: 'procurement_id',
  as: 'procurement',
});

Procurement.hasMany(ProcurementDocument, {
  foreignKey: 'procurement_id',
  as: 'documents',
});

ProcurementDocument.belongsTo(Procurement, {
  foreignKey: 'procurement_id',
  as: 'procurement',
});

// AssetTransfer head approval association
AssetTransfer.belongsTo(User, {
  foreignKey: 'head_approved_by',
  as: 'headApprover',
});

// InventoryRound associations
InventoryRound.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

User.hasMany(InventoryRound, {
  foreignKey: 'created_by',
  as: 'inventory_rounds',
});

// InventoryReport associations
InventoryReport.belongsTo(InventoryRound, {
  foreignKey: 'inventory_round_id',
  as: 'inventory_round',
});

InventoryRound.hasMany(InventoryReport, {
  foreignKey: 'inventory_round_id',
  as: 'reports',
});

InventoryReport.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

User.hasMany(InventoryReport, {
  foreignKey: 'created_by',
  as: 'inventory_reports',
});

InventoryReport.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

Department.hasMany(InventoryReport, {
  foreignKey: 'department_id',
  as: 'inventory_reports',
});

InventoryReport.belongsTo(User, {
  foreignKey: 'head_approved_by',
  as: 'headApprover',
});

InventoryReport.belongsTo(User, {
  foreignKey: 'admin_approved_by',
  as: 'adminApprover',
});

// InventoryReportDetail associations
InventoryReportDetail.belongsTo(InventoryReport, {
  foreignKey: 'inventory_report_id',
  as: 'inventory_report',
});

InventoryReport.hasMany(InventoryReportDetail, {
  foreignKey: 'inventory_report_id',
  as: 'details',
});

InventoryReportDetail.belongsTo(Asset, {
  foreignKey: 'asset_id',
  as: 'asset',
});

Asset.hasMany(InventoryReportDetail, {
  foreignKey: 'asset_id',
  as: 'inventory_details',
});

// AssetDisposalCase associations
AssetDisposalCase.belongsTo(InventoryReport, {
  foreignKey: 'source_inventory_report_id',
  as: 'source_inventory_report',
});

InventoryReport.hasMany(AssetDisposalCase, {
  foreignKey: 'source_inventory_report_id',
  as: 'disposal_cases',
});

// MaintenanceRequest <-> AssetDisposalCase (linked disposal case)
MaintenanceRequest.belongsTo(AssetDisposalCase, {
  foreignKey: 'linked_disposal_case_id',
  as: 'linkedDisposalCase',
});

AssetDisposalCase.belongsTo(MaintenanceRequest, {
  foreignKey: 'source_maintenance_request_id',
  as: 'sourceMaintenanceRequest',
});

AssetDisposalCase.belongsTo(Department, {
  foreignKey: 'origin_department_id',
  as: 'origin_department',
});

AssetDisposalCase.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

AssetDisposalCase.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver',
});

AssetDisposalCase.hasMany(AssetDisposalItem, {
  foreignKey: 'disposal_case_id',
  as: 'items',
});

AssetDisposalItem.belongsTo(AssetDisposalCase, {
  foreignKey: 'disposal_case_id',
  as: 'disposal_case',
});

AssetDisposalItem.belongsTo(Asset, {
  foreignKey: 'asset_id',
  as: 'asset',
});

Asset.hasMany(AssetDisposalItem, {
  foreignKey: 'asset_id',
  as: 'disposal_items',
});

AssetDisposalItem.belongsTo(InventoryReportDetail, {
  foreignKey: 'inventory_report_detail_id',
  as: 'inventory_detail',
});

AssetDisposalItem.belongsTo(Department, {
  foreignKey: 'moved_from_department_id',
  as: 'moved_from_department',
});

// Stock module associations
StockReceipt.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

StockIssue.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

StockReceipt.hasMany(StockReceiptLine, {
  foreignKey: 'receipt_id',
  as: 'lines',
});

StockReceiptLine.belongsTo(StockReceipt, {
  foreignKey: 'receipt_id',
  as: 'receipt',
});

StockIssue.hasMany(StockIssueLine, {
  foreignKey: 'issue_id',
  as: 'lines',
});

StockIssueLine.belongsTo(StockIssue, {
  foreignKey: 'issue_id',
  as: 'issue',
});

StockReceiptLine.belongsTo(StockItem, {
  foreignKey: 'item_id',
  as: 'item',
});

StockItem.hasMany(StockReceiptLine, {
  foreignKey: 'item_id',
  as: 'receipt_lines',
});

StockIssueLine.belongsTo(StockItem, {
  foreignKey: 'item_id',
  as: 'item',
});

StockItem.hasMany(StockIssueLine, {
  foreignKey: 'item_id',
  as: 'issue_lines',
});

export {
  User,
  Department,
  Asset,
  AssetTransfer,
  MaintenanceRequest,
  MaintenanceDamageImage,
  Procurement,
  ProcurementItem,
  ProcurementDocument,
  AnnualReport,
  AuditLog,
  RequestApproval,
  InventoryRound,
  InventoryReport,
  InventoryReportDetail,
  AssetCategory,
  AssetDisposalCase,
  AssetDisposalItem,
  AssetCondition,
  StockItem,
  StockReceipt,
  StockReceiptLine,
  StockIssue,
  StockIssueLine,
};

export default {
  User,
  Department,
  Asset,
  AssetTransfer,
  MaintenanceRequest,
  MaintenanceDamageImage,
  Procurement,
  ProcurementItem,
  ProcurementDocument,
  AnnualReport,
  AuditLog,
  RequestApproval,
  InventoryRound,
  InventoryReport,
  InventoryReportDetail,
  AssetCategory,
  AssetDisposalCase,
  AssetDisposalItem,
  StockItem,
  StockReceipt,
  StockReceiptLine,
  StockIssue,
  StockIssueLine,
};
