export default {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    status: 'Status',
    total: 'Total',
    loading: 'Loading...',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    home: 'Home',
    name: 'Name',
    description: 'Description',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    noData: 'No data',
    notSpecified: 'Not specified',
    refresh: 'Refresh',
    apiErrors: {
      network: 'Cannot connect to server. Please check your network.',
      sessionExpired: 'Session expired. Please login again.',
      forbidden: 'You do not have permission to perform this action.',
      notFound: 'Data not found.',
      rateLimit: 'Too many requests. Please try again later.',
      serverError: 'Server error. Please try again later.',
    },
    export: 'Export',
    import: 'Import',
    print: 'Print',
    viewAll: 'View All',
    auditInfo: 'Audit Information',
    years: 'years',
    year: 'year',
  },

  // Menu
  menu: {
    dashboard: 'Dashboard',
    assets: 'Asset Management',
    departments: 'Departments',
    users: 'Users',
    reports: 'Reports',
    maintenance: 'Procurement / Repair',
    purchaseRequests: 'Purchase requests',
    repairTracking: 'Repair tracking',
    procurements: 'Procurements',
    transfers: 'Transfers',
    settings: 'Settings',
    stock: 'Stock',
    assetDisposals: 'Asset Disposals',
    systemAdmin: 'System Admin',
    documentation: 'Documentation',
    support: 'Support',
  },

  helpDocs: {
    title: 'User documentation',
    subtitle:
      'Role-based guides for staff, department heads, and principals — focused on real workflows in the application.',
    rolesLead:
      'Open the tab that matches your role first. The overview cards below are a short reference for everyone; system administrators have extra tools (users, departments, audit logs, etc.).',
    tabStaff: 'Staff',
    tabHead: 'Department head',
    tabDirector: 'Principal / Director',
    overviewTitle: 'System feature overview',
    overviewLead:
      'Quick map of modules. Step-by-step procedures are in the Staff / Department head / Principal tabs above.',

    staff: {
      intro:
        'Staff work with assets and requests within their assigned department. You usually see only data and tickets linked to you or your unit.',
      sec1Title: 'Sign-in, security, and data scope',
      sec1Body: `1. Sign in with credentials issued by IT/admin. Enable 2FA if required (user menu, top right).
2. After login, check the displayed department; asset lists are usually pre-filtered to your unit.
3. Do not share accounts. If a password may be compromised, change it and notify admin.`,

      sec2Title: 'Browse unit assets (Assets menu)',
      sec2Body: `1. Open “Assets” and use search/filters by code, name, category, or status.
2. Open a row to see details: identification, current department, value, depreciation (if any), change history.
3. If QR labels exist, scan or search by printed code.
4. Bulk add/edit/import is typically admin-only unless your school assigns you that duty.`,

      sec3Title: 'Asset transfer requests (Transfers)',
      sec3Body: `1. To move an asset to another department: create a request with asset, from/to units, reason, and expected handover notes.
2. Submit; status stays pending until the head of the exporting department acts.
3. In this app, only the head of the department that currently holds the asset may approve or reject. If rejected, read the reason and fix the request or talk to your head.
4. After approval, the asset’s current department updates; verify in the asset detail screen.`,

      sec4Title: 'Purchase requests',
      sec4Body: `1. Create a request with items, quantities, estimates (if needed), and justification.
2. Track status on the list; further approvals are done by the department head and/or school level per your configuration.
3. Keep the reference ID for goods receipt or accounting questions.`,

      sec5Title: 'Repair / maintenance',
      sec5Body: `1. Create a repair request with a clear description and photos if allowed; set priority if the form supports it.
2. Typical flow: department head approves first, then admin or principal approves second before work starts.
3. Watch status and respond promptly if additional information is requested.`,

      sec6Title: 'Inventory',
      sec6Body: `1. When a round is opened, open it to see the checklist for your team.
2. Count physically; scan QR codes if enabled to match each asset.
3. Record variances (missing, surplus, wrong location) exactly as the form requires. Do not delete assets yourself; discrepancies go through head/principal review.
4. After data entry, reports may wait for department-head approval before going upward.`,

      sec7Title: 'Disposal / write-off',
      sec7Body: `1. Start only when there is an internal decision; fill the disposal case with reason, condition, and remaining value if required.
2. Track approval steps. Keep software state aligned with official paperwork if the school uses the app as the master tracker.
3. After completion, check the asset status in detail view.`,

      sec8Title: 'Notifications and escalation',
      sec8Body: `1. Watch notification icons for approvals, rejections, or “more info needed” events.
2. If menus or actions are missing, verify your role and department assignment with your head or admin.
3. Paper forms, councils, and thresholds follow your school’s regulations; the app tracks electronic status and records.`,

    },

    head: {
      intro:
        'Department heads approve at unit level, ensure records match reality, and validate requests before they go to school-level approvers.',
      sec1Title: 'Role and responsibilities',
      sec1Body: `1. You see tickets involving your unit: transfers from/to your department, purchase/repair/disposal/inventory initiated under your unit.
2. Before approving, reconcile with the field and internal rules. Rejections must include a clear reason.
3. Do not let others use your account; decisions are audit-logged.`,

      sec2Title: 'Approving asset transfers',
      sec2Body: `1. Open “Transfers” and filter pending items. You may approve only when your department is the exporting (current holder) department.
2. Review asset, destination, and reason. Approve or reject with mandatory reason text.
3. On approval, the system moves the asset to the receiving department and completes the ticket. Inform the receiver for physical handover.`,

      sec3Title: 'Approving repair requests (unit level)',
      sec3Body: `1. Open repair tracking; handle items waiting for the department head.
2. Judge urgency and feasibility against local rules, then approve level 1 to send upward as configured.
3. If rejecting, state why (missing documents, wrong form, etc.).`,

      sec4Title: 'Purchase requests from your unit',
      sec4Body: `1. Review purchase requests raised by staff for alignment with approved plans.
2. Complete the unit-level approval step before school-level review.
3. Track through completion; coordinate with accounting/supply when goods arrive.`,

      sec5Title: 'Inventory rounds and report approval',
      sec5Body: `1. Assign staff to scan/count against the list; compare ledger vs physical stock.
2. Review variance reports; send back for corrections when needed.
3. Perform the “department head approval” step on reports before they go to admin/principal, if enabled.`,

      sec6Title: 'Disposals initiated in your unit',
      sec6Body: `1. Check disposal dossiers for evidence and asset condition.
2. Approve to advance the workflow or return for fixes.
3. Ensure final records match legal and accounting books outside the app.`,

      sec7Title: 'Unit reports and coordination',
      sec7Body: `1. Use permitted reports to monitor your unit’s asset position.
2. Prepare figures when school leadership asks for explanations by period.
3. For permission issues contact IT; for asset policy questions contact the responsible school office.`,

    },

    director: {
      intro:
        'Principals/directors see school-wide data, higher-level approvals (as configured), consolidated reports, and procurement/stock modules when granted director-level access.',
      sec1Title: 'School-wide scope',
      sec1Body: `1. You can usually view assets, transfers, and reports across the school unless restricted.
2. Use aggregates to steer departments: stock by unit, purchase/repair workload, inventory progress.
3. The app complements—not replaces—signed paper decisions.`,

      sec2Title: 'School-level approvals (level 2)',
      sec2Body: `1. After department-head approval, repair/purchase items may await admin or principal action. Filter by “pending higher level” states.
2. Decide based on cost, urgency, and budget; approve or reject with reasons.
3. For large procurements, align with the school’s annual/quarterly plan before endorsing execution.`,

      sec3Title: 'Monitoring transfers between units',
      sec3Body: `1. Review all transfers to unblock disagreements or long-pending tickets.
2. Heads of exporting departments should approve within their mandate; you intervene when school-level direction is needed.
3. Periodically encourage redistribution of under-used assets per internal policy.`,

      sec4Title: 'Inventory and disposal at school level',
      sec4Body: `1. Track inventory rounds and deadlines; review major variances before closing a period if your workflow includes that step.
2. For disposals, ensure electronic records match official council/decision documents.
3. Direct follow-up on major losses or damage per school discipline and reporting rules.`,

      sec5Title: 'Reports, procurement, and stock (if visible)',
      sec5Body: `1. “Reports” supports exports and summaries by department/category/value for leadership meetings or external reporting.
2. “Procurements” and “Stock” (if shown) track receipts, issues, and balances.
3. Ask admins to adjust master data and permissions when the school structure changes.`,

      sec6Title: 'Working with IT and data safety',
      sec6Body: `1. Require timely user on/off-boarding in the system.
2. Encourage 2FA for key roles; follow your IT backup/restore policy.
3. When internal procedures change, update local guidance so staff and heads stay aligned with the software.`,

    },

    block1Title: 'Assets & QR codes',
    block1a: 'Add, edit, and search assets; filter by department, category, and status.',
    block1b: 'Excel import/export (admin); generate and print QR labels for assets.',
    block1c: 'View change history and depreciation details per asset.',
    block2Title: 'Transfers',
    block2a: 'Create transfer requests and track approval status.',
    block2b: 'Asset lists update by current department after completion.',
    block3Title: 'Inventory & disposal',
    block3a: 'Create inventory rounds, scan QR during counts, review variance reports.',
    block3b: 'Disposal / write-off workflows per your organization’s rules.',
    block4Title: 'Reports & access',
    block4a: 'Summary reports by department/category; export when permitted.',
    block4b: 'Admins manage users, departments, system settings, and audit logs.',
    tip: 'Paper thresholds, councils, and forms may go beyond what the app enforces—capture them in your internal regulations and training. Contact IT for permission or configuration changes.',
  },

  helpSupport: {
    title: 'Help & support',
    subtitle: 'Contact channels and FAQs. Your admin can replace placeholders with real details.',
    contactTitle: 'Technical contact',
    contactLabel: 'IT / System administration',
    contactHint:
      'Office hours follow your organization. Prefer email with a short description and screenshots.',
    emailLabel: 'Email:',
    phoneLabel: 'Phone:',
    faqTitle: 'Frequently asked questions',
    faq1q: 'I forgot my password — what should I do?',
    faq1a: 'Ask a system administrator to reset it. Never share passwords over insecure channels.',
    faq2q: 'I cannot see another department’s assets or menus?',
    faq2a: 'Access is scoped by role and department. Your head of unit or an admin can adjust permissions if needed.',
    faq3q: 'Pages fail to load or save?',
    faq3a: 'Reload, clear cache, or try another browser. If it persists, email support with time and username (never your password).',
  },

  inventory: {
    title: 'Inventory',
    roundDetail: 'Round detail',
    conduct: 'Conduct inventory',
    reportDetail: 'Report detail',
    roundStatus: {
      not_started: 'Not started',
      in_progress: 'In progress',
      completed: 'Completed',
      awaiting_approval: 'Awaiting approval',
    },
    reportStatus: {
      draft: 'Draft',
      pending: 'Pending',
      approved_by_head: 'Approved by Head',
      approved_by_admin: 'Approved by Admin',
      completed: 'Completed',
      rejected_by_head: 'Rejected by Head',
      rejected_by_admin: 'Rejected by Admin',
    },
  },

  // Auth
  auth: {
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember me',
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logout successful',
    loginFailed: 'Login failed',
    pleaseLogin: 'Please login to continue',
    sessionExpired: 'Session expired. Please login again.',
    enterUsername: 'Enter your username',
    enterPassword: 'Enter your password',
    passwordMinLength: 'Password must be at least 6 characters',
    changePassword: 'Change Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
  },

  // Categories
  categories: {
    // Main categories according to Appendix I
    building: 'Buildings & Construction',
    structure: 'Structures',
    car: 'Cars',
    vehicle: 'Other Vehicles',
    equipment: 'Machinery & Equipment',
    other_tangible: 'Other Tangible Fixed Assets',
    tools: 'Tools & Supplies',
    // Management type categories
    fixed_asset: 'Fixed Assets',
    project_asset: 'Project Assets',
    // Legacy categories (for old data)
    electronics: 'Electronics',
    furniture: 'Furniture',
    software: 'Software',
    other: 'Other',
  },

  // Assets
  assets: {
    title: 'Asset Management',
    addAsset: 'Add Asset',
    editAsset: 'Edit Asset',
    assetDetail: 'Asset Detail',
    assetCode: 'Asset Code',
    assetName: 'Asset Name',
    category: 'Category',
    department: 'Department',
    purchaseDate: 'Purchase Date',
    purchasePrice: 'Purchase Price (VND)',
    currentValue: 'Current Value',
    serialNumber: 'Serial Number',
    warrantyDate: 'Warranty Date',
    warrantyExpired: 'Warranty Expired',
    warrantyValid: 'Warranty Valid',
    depreciation: 'Wear and tear',
    location: 'Location',
    detailLocation: 'Detail Location',
    description: 'Description',
    assetType: 'Asset Type',
    assetTypePlaceholder: 'e.g: Laptop, Printer, Desk...',
    imageUrl: 'Asset Image',
    basicInfo: 'Basic Information',
    locationInfo: 'Location & Department',
    financialInfo: 'Financial Information',
    locationPlaceholder: 'e.g: Room 301, Floor 3, Building A',
    // Wear and tear info (equipment, fixed assets)
    depreciationInfo: 'Wear and tear information',
    usefulLife: 'Useful Life',
    annualDepreciationRate: 'Annual wear rate',
    yearsUsed: 'Years Used',
    remainingUsefulLife: 'Remaining Useful Life',
    depreciationProgress: 'Wear progress',
    annualDepreciation: 'Annual wear amount',
    accumulatedDepreciation: 'Accumulated wear',
    calculatedCurrentValue: 'Calculated current value',
    fullyDepreciated: 'Fully worn',
    nonDepreciable: 'No wear calculation',
    nonDepreciableDesc:
      'No straight-line rate. For 3 calendar years from the year put in service, remaining value equals cost; after that remaining value is 0.',
    depreciationRateLabel: 'Wear rate (%/year)',
    hasDepreciation: 'Has wear calculation',
    status: {
      active: 'Active',
      inactive: 'Inactive',
      damaged: 'Damaged',
      lost: 'Lost',
      disposed: 'Disposed',
      pending_repair: 'Pending Repair Request',
    },
    deleteConfirm: 'Are you sure you want to delete this asset?',
    deleteSuccess: 'Asset deleted successfully',
    createSuccess: 'Asset created successfully',
    updateSuccess: 'Asset updated successfully',
    searchPlaceholder: 'Search by code or asset name...',
    filterByCategory: 'Filter by category',
    filterByStatus: 'Filter by status',
    filterByDepartment: 'Filter by department',
  },

  // Departments
  departments: {
    title: 'Department Management',
    addDepartment: 'Add Department',
    editDepartment: 'Edit Department',
    departmentName: 'Department Name',
    departmentCode: 'Department Code',
    departmentType: 'Department Type',
    departmentDetails: 'Department Details',
    manager: 'Manager',
    parentDepartment: 'Parent Department',
    description: 'Description',
    type: 'Type',
    types: {
      department: 'Department',
      faculty: 'Faculty',
      center: 'Center',
      classroom: 'Classroom',
      lab: 'Practice Room',
      meeting_room: 'Meeting Room',
      hall: 'Hall',
    },
    deleteConfirm: 'Are you sure you want to delete this department?',
    deleteSuccess: 'Department deleted successfully',
    createSuccess: 'Department created successfully',
    updateSuccess: 'Department updated successfully',
    searchPlaceholder: 'Search departments...',
    filterByType: 'Filter by type',
  },

  // Users
  users: {
    title: 'User Management',
    addUser: 'Add User',
    editUser: 'Edit User',
    userDetails: 'User Details',
    fullname: 'Full Name',
    username: 'Username',
    email: 'Email',
    role: 'Role',
    department: 'Department',
    isActive: 'Active Status',
    lastLogin: 'Last Login',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    active: 'Active',
    inactive: 'Inactive',
    activate: 'Activate',
    deactivate: 'Deactivate',
    roles: {
      admin: 'System Administrator',
      manager: 'Department Head',
      staff: 'Staff',
      user: 'User',
    },
    deleteConfirm: 'Are you sure you want to delete this user?',
    deleteSuccess: 'User deleted successfully',
    createSuccess: 'User created successfully',
    updateSuccess: 'User updated successfully',
    searchPlaceholder: 'Search users...',
    filterByRole: 'Filter by role',
    filterByStatus: 'Filter by status',
    toggleStatusConfirm: 'Are you sure you want to {action} this user?',
    resetPassword: 'Reset Password',
    resetPasswordConfirm: 'Are you sure you want to reset password to default for this user?',
    resetPasswordSuccess: 'Password reset successfully',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome to Asset Management System',
    totalAssets: 'Total Assets',
    totalDepartments: 'Total Departments',
    totalUsers: 'Total Users',
    recentAssets: 'Recent Assets',
    assetsByCategory: 'Assets by Category',
    assetsByStatus: 'Assets by Status',
    assetsByDepartment: 'Assets by Department',
    quickStats: 'Quick Stats',
    activeAssets: 'Active Assets',
    inactiveAssets: 'Inactive Assets',
    damagedAssets: 'Damaged Assets',
  },

  // Language
  language: {
    title: 'Language',
    vietnamese: 'Tiếng Việt',
    english: 'English',
  },

  // Validation
  validation: {
    required: 'This field is required',
    email: 'Invalid email address',
    invalidEmail: 'Invalid email address',
    minLength: 'Minimum {min} characters',
    maxLength: 'Maximum {max} characters',
    stringLength: 'Length must be between {min} and {max} characters',
    passwordMatch: 'Password confirmation does not match',
    passwordMismatch: 'Password confirmation does not match',
  },

  // Table
  table: {
    noData: 'No data',
    loading: 'Loading...',
    itemsPerPage: 'Items per page',
    page: 'Page',
    of: 'of',
    items: 'items',
  },

  // Transfers
  transfers: {
    title: 'Asset Transfers',
    createTransfer: 'Create Transfer',
    editTransfer: 'Edit Transfer',
    transferDetail: 'Transfer Detail',
    transferList: 'Transfer List',
    asset: 'Asset',
    assetCode: 'Asset Code',
    assetName: 'Asset Name',
    fromDepartment: 'From Department',
    toDepartment: 'To Department',
    transferDate: 'Transfer Date',
    reason: 'Reason',
    notes: 'Notes',
    enterNotes: 'Enter notes...',
    requestedBy: 'Requested By',
    approvedBy: 'Approved By',
    transferStatus: 'Transfer Status',
    searchAsset: 'Search Asset',
    enterAssetCode: 'Enter asset code',
    selectAsset: 'Select Asset',
    selectDepartment: 'Select Department',
    selectSourceDepartment: 'Select Source Department',
    selectTargetDepartment: 'Select Target Department',
    selectSourceDepartmentFirst: 'Please select source department first',
    selectedAssetInfo: 'Selected Asset Information',
    assetCount: 'Total assets: {count}',
    transferNote: 'After approval, the asset will automatically transfer to the target department and the history will be saved.',
    enterReason: 'Enter transfer reason',
    rejectReason: 'Enter rejection reason',
    sameDepartmentError: 'Destination department must be different from current department',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    },
    approveConfirm: 'Are you sure you want to approve this transfer?',
    rejectConfirm: 'Are you sure you want to reject this transfer?',
    approveSuccess: 'Transfer approved successfully',
    rejectSuccess: 'Transfer rejected successfully',
    createSuccess: 'Transfer created successfully',
    updateSuccess: 'Transfer updated successfully',
    filterByStatus: 'Filter by status',
    filterByDepartment: 'Filter by department',
    approve: 'Approve',
    reject: 'Reject',
  },

  // Procurement & Repair
  maintenance: {
    title: 'Procurement/Repair',
    tabs: {
      procurement: 'Equipment Procurement',
    },
    // Procurement
    procurement: {
      title: 'Equipment Procurement Plan',
      createRequest: 'Create Procurement Request',
      editRequest: 'Edit Procurement Request',
      requestDetail: 'Procurement Request Detail',
      deviceName: 'Device Name, Model',
      technicalSpecs: 'Technical Specifications',
      unit: 'Unit',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      totalPrice: 'Total Price',
      directUser: 'Direct User Department',
      normLimit: 'Limit (Max Qty)',
      currentQuantity: 'Current Qty',
      justification: 'Justification',
      categories: {
        lab: 'Lab Equipment',
        it: 'IT Equipment',
        projection: 'Projection Equipment',
        office: 'Office Equipment',
        electronic: 'Electronic Equipment',
        other: 'Other Equipment',
        furniture: 'Office Furniture',
      },
    },
    // Common fields
    createRequest: 'Create Request',
    editRequest: 'Edit Request',
    requestDetail: 'Request Detail',
    requestList: 'Request List',
    asset: 'Asset',
    assetCode: 'Asset Code',
    assetName: 'Asset Name',
    selectAsset: 'Select Asset',
    department: 'Department',
    selectDepartment: 'Select Department',
    requestType: 'Request Type',
    urgency: 'Urgency',
    description: 'Description',
    requestedBy: 'Requested By',
    assignedTo: 'Assigned To',
    assignTo: 'Assign To',
    selectAssignee: 'Select Assignee',
    requestDate: 'Request Date',
    cost: 'Cost',
    estimatedCost: 'Estimated Cost',
    actualCost: 'Actual Cost',
    completedDate: 'Completed Date',
    startDate: 'Start Date',
    selectStartDate: 'Select Start Date',
    completionDate: 'Completion Date',
    selectCompletionDate: 'Select Completion Date',
    notes: 'Notes',
    enterNotes: 'Enter notes...',
    technicalNotes: 'Technical Notes',
    resolution: 'Resolution',
    enterDescription: 'Describe in detail',
    enterTechnicalNotes: 'Enter technical notes',
    enterResolution: 'Enter resolution',
    statusTimeline: 'Status Timeline',
    approve: 'Approve',
    approveConfirm: 'Are you sure you want to approve this request?',
    approveSuccess: 'Request approved successfully',
    types: {
      procurement: 'Procurement',
      equipment_repair: 'Equipment Repair',
      facility_repair: 'Facility Repair',
      repair: 'Repair',
      maintenance: 'Scheduled Maintenance',
      upgrade: 'Upgrade',
      inspection: 'Inspection',
    },
    urgency_level: {
      low: 'Low',
      normal: 'Normal',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    },
    status: {
      new: 'New',
      pending: 'Pending',
      approved: 'Approved',
      in_progress: 'In Progress',
      done: 'Done',
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    },
    createSuccess: 'Request created successfully',
    updateSuccess: 'Request updated successfully',
    deleteSuccess: 'Request deleted successfully',
    deleteConfirm: 'Are you sure you want to delete this request?',
    filterByUrgency: 'Filter by urgency',
    filterByStatus: 'Filter by status',
    filterByType: 'Filter by type',
    filterByDepartment: 'Filter by department',
    startProgress: 'Start Progress',
    markComplete: 'Mark Complete',
    total: 'Total',
  },

  // Reports
  reports: {
    title: 'Annual Reports',
    createReport: 'Create Report',
    editReport: 'Edit Report',
    reportDetail: 'Report Detail',
    reportList: 'Report List',
    department: 'Department',
    year: 'Year',
    totalAssets: 'Total Assets',
    activeAssets: 'Active Assets',
    damagedAssets: 'Damaged Assets',
    lostAssets: 'Lost Assets',
    totalValue: 'Total Value',
    notes: 'Notes',
    selectDepartment: 'Select Department',
    selectYear: 'Select Year',
    selectDepartmentFirst: 'Please select a department first',
    enterNotes: 'Enter notes...',
    assetStatistics: 'Asset Statistics',
    autoCalculate: 'Auto Calculate',
    autoCalculateHint: 'Automatically calculate statistics from department assets',
    calculateSuccess: 'Statistics calculated successfully',
    purposeAndWorkflow:
      'Purpose: summarize each department’s asset figures by year (as of year-end) for school-level records and review. Open View for a full-year activity rollup (transfers, procurement/repair, asset intake, disposals, inventory, etc.). Workflow: department head or admin creates → edit figures/notes → submit; admin or principal approves or rejects. Staff usually only see their unit’s reports.',
    detailIntro:
      'This is an annual report per department and year. Statistics are derived from assets assigned to the department at year-end (and can be edited before submission).',
    statisticsBasis:
      'Figures include assets in the department with purchase date on or before the report year-end (or missing purchase date).',
    workflowRoles: 'Who does what',
    roleInitiator: 'Create & submit',
    roleInitiatorDesc: 'Department head or system admin (draft, update figures, submit for approval).',
    roleApprover: 'Approval',
    roleApproverDesc: 'System admin or principal (approve or reject after submission).',
    createdBy: 'Created by',
    submittedBy: 'Submitted by',
    submittedAt: 'Submitted at',
    approvedBy: 'Approved by',
    approvedAt: 'Approved at',
    rejectedBy: 'Rejected by',
    rejectedAt: 'Rejected at',
    notesEmpty: 'No notes.',
    statusHistory: 'Status History',
    draftDescription: 'Report is in draft; figures can be edited before submission.',
    submittedDescription: 'Report submitted for approval',
    submittedDescriptionDetail: 'Waiting for approval. Submitted by: {name}.',
    approvedDescription: 'Report approved and finalized',
    approvedDescriptionDetail: 'Report accepted. Approved by: {name}.',
    rejectedDescriptionDetail: 'Report not accepted. Handled by: {name}.',
    status: {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    submit: 'Submit',
    approve: 'Approve',
    reject: 'Reject',
    submitConfirm: 'Are you sure you want to submit this report for approval?',
    approveConfirm: 'Are you sure you want to approve this report?',
    rejectConfirm: 'Enter the reason for rejecting this report:',
    rejectReasonHint: 'Reason for rejection…',
    submitSuccess: 'Report submitted successfully',
    approveSuccess: 'Report approved successfully',
    rejectSuccess: 'Report rejected successfully',
    createSuccess: 'Report created successfully',
    updateSuccess: 'Report updated successfully',
    deleteSuccess: 'Report deleted successfully',
    deleteConfirm: 'Are you sure you want to delete this report?',
    filterByYear: 'Filter by year',
    filterByStatus: 'Filter by status',
    filterByDepartment: 'Filter by department',
    scopeUnitOnly: 'Only reports for your department are shown (applied automatically).',
    adminListHint: 'Admin / Principal: leave department empty to see all units. Pick a department to narrow results.',
    bulkApprove: 'Approve selected',
    bulkApproveConfirm:
      'Only submitted reports will be approved. Other rows are skipped or reported in the summary. Continue?',
    bulkApproveSuccess: 'Bulk approval finished',
    bulkApproveDetail: 'Approved: {ok}, Skipped (already approved): {skip}, Failed: {fail}',
    bulkApproveNoSelection: 'Select at least one submitted report',
    bulkApproveFailedHint:
      'Some rows could not be approved: only submitted reports (not drafts) can be approved. Check the status column.',

    yearSummary: {
      title: 'Unit activity summary for the report year',
      lead:
        'Aggregates data from: assets (all statuses), transfers, purchase/repair requests, asset intake (procurement cases), liquidation/destruction cases, inventory reports, and assets newly recorded or purchased in the year.',
      stockExcluded:
        'Note: central stock receipts/issues are not attributed per department and are not included here.',
      snapshotTitle: '1. Asset snapshot (year-end scope, same rules as the report)',
      snapshotScope:
        'Assets in the department with purchase date on or before 31 Dec of the report year (or missing purchase date), grouped by current system status.',
      activityTitle: '2. Activity in the calendar year (1 Jan — 31 Dec)',
      activityScope:
        'Counts records whose created_at falls in the year, scoped to the relevant department (requesting, receiving, case origin, etc.).',
      totalInScope: 'Assets in scope',
      totalValueLive: 'Total value (recalculated from current data)',
      byAssetStatus: 'Breakdown by asset status',
      colStatus: 'Status / type',
      colCount: 'Count',
      colType: 'Type',
      transfers: 'Asset transfers',
      transferTotal: 'Tickets involving the unit',
      transferOut: 'Outgoing from unit',
      transferIn: 'Incoming to unit',
      maintenance: 'Purchase / repair requests',
      maintTotal: 'Total tickets',
      maintRepair: 'Repair',
      maintProcurement: 'Procurement / allocation',
      procurements: 'Asset intake (Procurement)',
      procTotal: 'Total cases (receiving department)',
      disposals: 'Liquidation / destruction cases',
      dispTotal: 'Total cases (origin department)',
      byCaseStatus: 'By case status',
      byDisposalType: 'By disposal type',
      inventory: 'Inventory reports',
      invCount: 'Report count',
      invDiscSum: 'Sum of discrepancies',
      invDispSuggestSum: 'Sum of disposal suggestions',
      newAssets: 'Assets recorded / purchased in year',
      newAssetsScope:
        'Assets currently in the unit with system created_at or purchase date in the report year.',
      newAssetsCount: 'Count',

      assetStatus: {
        active: 'In use',
        inactive: 'Inactive',
        damaged: 'Damaged',
        lost: 'Lost',
        disposed: 'Disposed',
        pending_disposal: 'Pending disposal',
        pending_repair: 'Pending repair',
      },
      transferStatus: {
        pending: 'Pending',
        approved_by_head: 'Approved by head',
        approved: 'Approved',
        rejected: 'Rejected',
        rejected_by_head: 'Rejected by head',
        completed: 'Completed',
        '—': '(Empty)',
      },
      maintStatus: {
        draft: 'Draft',
        new: 'New',
        pending: 'Pending L1',
        approved: 'Approved',
        approved_by_head: 'Approved L1',
        approved_by_admin: 'Approved L2',
        approved_by_director: 'Approved L3',
        in_progress: 'In progress',
        repair_completed: 'Repair done, pending approval',
        repair_approved: 'Repair completion approved',
        completed: 'Completed',
        rejected: 'Rejected',
        rejected_by_head: 'Rejected L1',
        rejected_by_admin: 'Rejected L2',
        rejected_by_director: 'Rejected L3',
        rejected_due_to_high_cost: 'Rejected (high cost)',
        '—': '(Empty)',
      },
      procurementStatus: {
        draft: 'Draft',
        fulfilled: 'Fulfilled',
        cancelled: 'Cancelled',
        '—': '(Empty)',
      },
      disposalCaseStatus: {
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled',
        '—': '(Empty)',
      },
      disposalType: {
        liquidation: 'Liquidation',
        destruction: 'Destruction',
        '—': '(Not set)',
      },
      inventoryReportStatus: {
        draft: 'Draft',
        pending: 'Pending',
        approved_by_head: 'Head approved',
        approved_by_admin: 'Admin approved',
        rejected_by_head: 'Head rejected',
        rejected_by_admin: 'Admin rejected',
        completed: 'Completed',
        '—': '(Empty)',
      },
    },
  },

  procurement: {
    status: {
      draft: 'Draft',
      fulfilled: 'Fulfilled',
      cancelled: 'Cancelled',
    },
  },

  assetDisposals: {
    subtitle: 'Disposal / destruction cases',
    createCase: 'Create disposal case',
    searchPlaceholder: 'Search by case code',
    caseCode: 'Case code',
    status: {
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
  },
};
