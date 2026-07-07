export default {
  // Fallback khi meta.titleKey bị cache/trùng chuỗi tiếng Việt (breadcrumb)
  'Đề nghị mua sắm': 'Đề nghị mua sắm',
  'Theo dõi sửa chữa': 'Theo dõi sửa chữa',

  // Common
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    view: 'Xem',
    add: 'Thêm',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    actions: 'Thao tác',
    status: 'Trạng thái',
    total: 'Tổng',
    loading: 'Đang tải...',
    confirm: 'Xác nhận',
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    yes: 'Có',
    no: 'Không',
    close: 'Đóng',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước đó',
    home: 'Trang chủ',
    name: 'Tên',
    description: 'Mô tả',
    createdAt: 'Ngày tạo',
    updatedAt: 'Ngày cập nhật',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    all: 'Tất cả',
    noData: 'Không có dữ liệu',
    notSpecified: 'Chưa xác định',
    refresh: 'Làm mới',
    apiErrors: {
      network: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
      sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      forbidden: 'Bạn không có quyền thực hiện thao tác này.',
      notFound: 'Không tìm thấy dữ liệu.',
      rateLimit: 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.',
      serverError: 'Lỗi server. Vui lòng thử lại sau.',
    },
    export: 'Xuất',
    import: 'Nhập',
    print: 'In',
    viewAll: 'Xem tất cả',
    auditInfo: 'Thông tin kiểm soát',
    years: 'năm',
    year: 'năm',
  },

  // Menu
  menu: {
    dashboard: 'Bảng điều khiển',
    assets: 'Quản lý tài sản',
    departments: 'Phòng ban',
    users: 'Người dùng',
    reports: 'Báo cáo',
    maintenance: 'Mua sắm / Sửa chữa',
    purchaseRequests: 'Đề nghị mua sắm',
    repairTracking: 'Theo dõi sửa chữa',
    procurements: 'Tăng/Giảm tài sản',
    transfers: 'Điều chuyển',
    stock: 'Kho vật tư',
    assetDisposals: 'Giảm tài sản',
    systemAdmin: 'Quản trị hệ thống',
    auditLogs: 'Nhật ký hoạt động',
    notifications: 'Hộp thư thông báo',
    assetCategories: 'Danh mục tài sản',
    documentation: 'Tài liệu',
    support: 'Hỗ trợ',
  },

  helpDocs: {
    title: 'Tài liệu hướng dẫn',
    subtitle:
      'Hướng dẫn sử dụng theo vai trò: viên chức, trưởng đơn vị, giám hiệu và quản trị viên — tập trung vào quy trình và thao tác thực tế trên phần mềm.',
    rolesLead:
      'Ưu tiên đọc tab đúng với vai trò của bạn. Phần "Tổng quan chức năng" phía dưới là bản rút gọn cho mọi vai trò.',
    tabStaff: 'Viên chức',
    tabHead: 'Trưởng đơn vị',
    tabDirector: 'Giám hiệu',
    tabAdmin: 'Quản trị viên',
    overviewTitle: 'Tổng quan chức năng hệ thống',
    overviewLead:
      'Bảng sau giúp định vị nhanh các module. Chi tiết cách làm việc từng bước nằm ở các tab phía trên.',

    staff: {
      intro:
        'Viên chức thao tác trên tài sản và các đề nghị thuộc phạm vi đơn vị được gán. Bạn chỉ thấy dữ liệu và phiếu liên quan đến mình hoặc đơn vị mình (trừ khi được cấp quyền khác).',
      sec1Title: 'Đăng nhập, bảo mật và phạm vi dữ liệu',
      sec1Body: `1. Đăng nhập bằng tên đăng nhập và mật khẩu do quản trị cấp. Nên bật xác thực hai bước (2FA) nếu đơn vị yêu cầu (menu người dùng góc phải).
2. Sau khi đăng nhập, kiểm tra tên đơn vị hiển thị trên giao diện; mọi danh sách “Tài sản đơn vị” thường đã được lọc theo đơn vị của bạn.
3. Không chia sẻ tài khoản. Nếu nghi ngờ lộ mật khẩu, đổi mật khẩu ngay và báo quản trị.`,

      sec2Title: 'Tra cứu tài sản đơn vị (menu Tài sản)',
      sec2Body: `1. Vào menu “Tài sản” (hoặc “Tài sản đơn vị”). Dùng ô tìm kiếm/lọc theo mã, tên, danh mục, trạng thái để tìm nhanh.
2. Nhấp một dòng để mở chi tiết: xem thông tin định danh, phòng ban hiện tại, giá trị, khấu hao (nếu có), lịch sử thay đổi.
3. Nếu tài sản có mã QR: có thể dùng chức năng quét (trên trình duyệt/thiết bị hỗ trợ) hoặc tra cứu bằng mã in trên nhãn.
4. Viên chức thường không thêm/sửa/xóa hàng loạt trừ khi đơn vị giao nhiệm vụ; thao tác “Thêm tài sản”, import Excel thường dành cho quản trị.`,

      sec3Title: 'Đề nghị điều chuyển tài sản (menu Điều chuyển)',
      sec3Body: `1. Khi cần chuyển tài sản sang phòng ban khác: vào “Điều chuyển” → tạo yêu cầu mới, chọn tài sản, đơn vị đi, đơn vị đến, ghi rõ lý do và thời gian bàn giao dự kiến (theo biểu mẫu trên màn hình).
2. Gửi yêu cầu. Trạng thái sẽ hiển thị dạng “chờ xử lý” cho đến khi Trưởng đơn vị nơi xuất tài sản xử lý.
3. Trong hệ thống: chỉ Trưởng đơn vị của phòng ban đang giữ tài sản (đơn vị xuất) mới được phê duyệt hoặc từ chối. Nếu bị từ chối, đọc lý do và chỉnh lại hồ sơ hoặc liên hệ trưởng đơn vị.
4. Sau khi được duyệt, phần mềm cập nhật phòng ban hiện tại của tài sản; bạn có thể kiểm tra lại trong chi tiết tài sản.`,

      sec4Title: 'Đề nghị mua sắm (menu Đề nghị mua sắm)',
      sec4Body: `1. Dùng khi đơn vị cần mua thiết bị/vật tư theo quy trình nội bộ: tạo phiếu đề nghị, điền nội dung, số lượng, dự toán (nếu có), lý do.
2. Theo dõi trạng thái phiếu trên danh sách; các bước duyệt tiếp theo do Trưởng đơn vị và/hoặc cấp trường/quản trị thực hiện tùy cấu hình đơn vị.
3. Lưu số phiếu hoặc mã tham chiếu để đối chiếu khi nhận hàng hoặc khi kế toán hỏi.`,

      sec5Title: 'Bảo trì / sửa chữa (menu Theo dõi sửa chữa hoặc tương đương)',
      sec5Body: `1. Khi tài sản hư hỏng hoặc cần bảo dưỡng: tạo “yêu cầu sửa chữa”, mô tả hiện trạng, đính kèm ảnh nếu được phép, ghi mức độ ưu tiên nếu có.
2. Luồng điển hình: Trưởng đơn vị duyệt cấp 1 → quản trị (hoặc giám hiệu, tùy quy định) duyệt cấp 2 trước khi thực hiện.
3. Theo dõi trạng thái (chờ duyệt, đang xử lý, hoàn thành…). Khi có yêu cầu bổ sung thông tin, cập nhật đúng trường dữ liệu để tránh chậm xử lý.`,

      sec6Title: 'Kiểm kê tài sản (menu Kiểm kê)',
      sec6Body: `1. Khi đơn vị phát động đợt kiểm kê: bạn sẽ thấy đợt/phiếu được giao trong phần kiểm kê. Mở đợt để xem danh sách tài sản cần kiểm.
2. Thực hiện kiểm đếm thực tế; nếu có quét QR, quét mã từng tài sản để ghi nhận đúng vị trí và trạng thái hiện trường.
3. Ghi nhận lệch (nếu có): tài sản thiếu, thừa, sai vị trí — theo đúng biểu mẫu trên màn hình. Không tự ý xóa tài sản; mọi sai lệch cần được trưởng đơn vị/giám hiệu xem xét theo quy trình.
4. Sau khi hoàn thành nhập liệu, báo cáo có thể ở trạng thái chờ Trưởng đơn vị duyệt trước khi gửi lên cấp trên.`,

      sec7Title: 'Thanh lý / giảm tài sản (menu Thanh lý hoặc Giảm tài sản)',
      sec7Body: `1. Chỉ khởi tạo khi có quyết định hoặc chủ trương nội bộ; tạo hồ sơ đề nghị, đính kèm lý do, tình trạng tài sản, giá trị còn lại (nếu hệ thống yêu cầu).
2. Theo dõi các bước phê duyệt. Không chuyển trạng thái tài sản sang thanh lý ngoài luồng phần mềm nếu đơn vị quy định dùng hệ thống làm sổ theo dõi chính.
3. Sau khi hoàn tất, tài sản có thể ở trạng thái chờ thanh lý/đã xử lý theo cấu hình — kiểm tra lại trên chi tiết tài sản.`,

      sec8Title: 'Thông báo và liên hệ khi vướng quy trình',
      sec8Body: `1. Theo dõi biểu tượng thông báo (nếu bật) để biết phiếu được duyệt/từ chối hoặc có yêu cầu bổ sung.
2. Nếu không thấy menu hoặc không gửi được phiếu: kiểm tra lại vai trò tài khoản; liên hệ Trưởng đơn vị hoặc quản trị để được gán quyền/đơn vị đúng.
3. Chi tiết quy định số hóa đơn, mẫu biên bản giấy, hội đồng thanh lý… do nhà trường ban hành — phần mềm hỗ trợ theo dõi trạng thái và hồ sơ điện tử.`,

    },

    head: {
      intro:
        'Trưởng đơn vị chịu trách nhiệm phê duyệt cấp đơn vị, đảm bảo số liệu tài sản khớp thực tế và các đề nghị xuất phát từ đơn vị hợp lệ trước khi chuyển lên cấp trường hoặc quản trị.',
      sec1Title: 'Vai trò và trách nhiệm chung',
      sec1Body: `1. Bạn thấy các phiếu có liên quan đến đơn vị mình: điều chuyển có đơn vị xuất hoặc đơn vị nhận là đơn vị bạn quản lý; đề nghị mua sắm/sửa chữa/thanh lý/kiểm kê do đơn vị khởi tạo.
2. Trước khi duyệt: đối chiếu hiện trường, chứng từ giấy (nếu có) và quy định nội bộ. Từ chối phải ghi rõ lý do để viên chức chỉnh sửa.
3. Không duyệt hộ người khác bằng tài khoản của mình; mọi quyết định gắn với nhật ký hệ thống.`,

      sec2Title: 'Phê duyệt điều chuyển tài sản',
      sec2Body: `1. Vào “Điều chuyển”, lọc phiếu trạng thái “chờ xử lý” (hoặc tương đương). Hệ thống chỉ cho phép bạn duyệt các phiếu mà đơn vị xuất tài sản là đơn vị bạn làm Trưởng đơn vị.
2. Mở chi tiết phiếu: kiểm tra tài sản, đơn vị đến, lý do. Nếu đồng ý → Phê duyệt; nếu không đạt → Từ chối và nhập lý do bắt buộc.
3. Sau khi phê duyệt, hệ thống cập nhật phòng ban hiện tại của tài sản sang đơn vị nhận và hoàn tất phiếu. Thông báo cho bên nhận để bàn giao thực tế và cập nhật sổ sách (nếu có).`,

      sec3Title: 'Phê duyệt yêu cầu sửa chữa / bảo trì (cấp đơn vị)',
      sec3Body: `1. Vào mục theo dõi sửa chữa, xem các yêu cầu do viên chức đơn vị tạo ở trạng thái chờ Trưởng đơn vị.
2. Đánh giá mức độ cần thiết, khả năng kinh phí sửa chữa theo quy định đơn vị. Duyệt cấp 1 để chuyển sang vòng quản trị/giám hiệu (tùy cấu hình).
3. Nếu từ chối: nêu rõ lý do (ví dụ: chưa đủ hồ sơ, dùng sai biểu mẫu) để người tạo bổ sung.`,

      sec4Title: 'Đề nghị mua sắm và theo dõi tiến độ đơn vị',
      sec4Body: `1. Rà soát các phiếu đề nghị mua sắm phát sinh từ đơn vị: đảm bảo nội dung khớp kế hoạch được duyệt (nếu có).
2. Thực hiện bước phê duyệt cấp đơn vị (nếu được cấu hình) trước khi phiếu lên cấp trường.
3. Theo dõi trạng thái đến khi hoàn tất; phối hợp kế toán/vật tư khi có nhập kho hoặc bàn giao tài sản mới.`,

      sec5Title: 'Kiểm kê: tổ chức thực hiện và duyệt báo cáo đơn vị',
      sec5Body: `1. Khi có đợt kiểm kê: phân công viên chức quét mã/kiểm đếm theo danh sách; đối chiếu tồn sổ với thực tế.
2. Sau khi dữ liệu kiểm kê được nhập, kiểm tra báo cáo lệch; xác nhận hoặc yêu cầu làm lại phần sai sót rõ ràng.
3. Thực hiện bước “duyệt cấp Trưởng đơn vị” trên báo cáo (nếu có) trước khi báo cáo được gửi lên quản trị/giám hiệu.`,

      sec6Title: 'Thanh lý / giảm tài sản phát sinh từ đơn vị',
      sec6Body: `1. Xem xét hồ sơ đề nghị thanh lý do viên chức khởi tạo: tình trạng tài sản, căn cứ quyết định, tính đầy đủ minh chứng.
2. Nếu đồng ý chuyển tiếp quy trình, thực hiện thao tác phê duyệt theo từng bước trên hệ thống; nếu chưa đạt, trả lại và yêu cầu bổ sung.
3. Đảm bảo sau khi hoàn tất, số liệu tài sản đơn vị phản ánh đúng thực tế pháp lý và sổ kế toán (ngoài hệ thống).`,

      sec7Title: 'Báo cáo phạm vi đơn vị và phối hợp cấp trên',
      sec7Body: `1. Sử dụng các báo cáo/thống kê được phép với vai trò của bạn (nếu menu Báo cáo hiển thị) để đối chiếu tồn tại đơn vị.
2. Chuẩn bị số liệu khi giám hiệu hoặc quản trị yêu cầu làm rõ biến động tài sản theo kỳ.
3. Mọi thắc mắc về quyền hạn trên phần mềm: liên hệ quản trị hệ thống; thắc mắc về quy chế tài sản: làm việc với phòng chức năng của nhà trường.`,

    },

    director: {
      intro:
        'Giám hiệu có tầm nhìn toàn trường: xem các luồng phê duyệt sửa chữa/cấp cao, báo cáo tổng hợp. Lưu ý: các menu Kho vật tư, Mua sắm/Cấp phát và Quản trị hệ thống chỉ dành riêng cho Quản trị viên — Giám hiệu không có quyền truy cập các mục này.',
      sec1Title: 'Phạm vi quyền và dữ liệu toàn trường',
      sec1Body: `1. Tài khoản giám hiệu thường xem được tài sản, điều chuyển và báo cáo trên phạm vi toàn trường (trừ khi cấu hình hạn chế).
2. Dùng dữ liệu tổng hợp để chỉ đạo: tồn kho tài sản theo đơn vị, tình hình đề nghị mua sắm/sửa chữa, tiến độ kiểm kê.
3. Không thay thế chữ ký pháp lý trên văn bản giấy; phần mềm là công cụ theo dõi và phối hợp với hồ sơ giấy theo quy định.`,

      sec2Title: 'Phê duyệt cấp trường (sửa chữa, mua sắm, các phiếu cấp 2)',
      sec2Body: `1. Đối với yêu cầu sửa chữa/bảo trì: sau khi Trưởng đơn vị duyệt cấp 1, các yêu cầu có thể chuyển đến bước quản trị hoặc giám hiệu (cấp 2). Vào danh sách yêu cầu, lọc trạng thái “chờ cấp trên” hoặc tương đương.
2. Xem xét mức chi phí, tính cấp thiết, khả năng ngân sách; phê duyệt hoặc từ chối có lý do.
3. Với đề nghị mua sắm lớn hoặc nhiều tài sản: đối chiếu kế hoạch năm/quý của nhà trường trước khi đồng ý chuyển tiếp thực hiện.`,

      sec3Title: 'Theo dõi điều chuyển và cân đối tài sản giữa các đơn vị',
      sec3Body: `1. Vào “Điều chuyển” để xem toàn bộ phiếu; hỗ trợ giải quyết vướng mắc khi hai đơn vị chưa thống nhất hoặc phiếu chờ quá lâu.
2. Khuyến khích Trưởng đơn vị duyệt đúng thẩm quyền nơi xuất tài sản; giám hiệu can thiệp khi cần chỉ đạo hiệu lực nội bộ.
3. Định kỳ rà soát tài sản “ít sử dụng” tại một đơn vị để điều chuyển hợp lý (trên cơ sở quyết định nội bộ).`,

      sec4Title: 'Kiểm kê và thanh lý cấp trường',
      sec4Body: `1. Theo dõi tiến độ các đợt kiểm kê; yêu cầu đơn vị hoàn thành đúng hạn. Xem báo cáo lệch tổng hợp trước khi phê duyệt khóa sổ kỳ kiểm kê (nếu có bước này trên hệ thống).
2. Với thanh lý: đảm bảo hồ sơ điện tử khớp quyết định thanh lý/hội đồng theo quy chế nhà trường.
3. Chỉ đạo xử lý các trường hợp sai lệch lớn (mất mát, hư hỏng nặng) theo quy trình kỷ luật và báo cáo cấp trên nếu cần.`,

      sec5Title: 'Báo cáo tổng hợp và phối hợp cấp trên',
      sec5Body: `1. Menu "Báo cáo": dùng để xuất/xem thống kê theo phòng ban, danh mục, giá trị — phục vụ họp giao ban hoặc báo cáo Sở/đoàn thanh tra.
2. Yêu cầu Quản trị viên hỗ trợ cấu hình danh mục, phòng ban, nhập liệu tài sản mới và điều chỉnh quyền khi cần.
3. Khi đổi quy trình nội bộ: thông báo cho Quản trị viên cập nhật hướng dẫn; thông báo cho Trưởng đơn vị/viên chức để thao tác thống nhất trên phần mềm.`,

    },

    admin: {
      intro:
        'Quản trị viên có toàn quyền trên hệ thống: quản lý tài khoản, cấu hình danh mục/phòng ban, kho vật tư, mua sắm/cấp phát và xem nhật ký hệ thống. Đây là vai trò duy nhất có thể truy cập các menu Kho vật tư, Mua sắm, Quản trị hệ thống.',
      sec1Title: 'Quản lý tài khoản người dùng',
      sec1Body: `1. Vào "Quản trị hệ thống > Người dùng": tạo tài khoản mới, gán vai trò (admin / giám hiệu / trưởng đơn vị / viên chức), gắn phòng ban.
2. Vô hiệu hóa tài khoản khi nhân sự nghỉ việc hoặc chuyển công tác; không xóa để giữ lịch sử thao tác.
3. Đặt lại mật khẩu khi người dùng quên; nhắc đổi mật khẩu ngay sau lần đầu đăng nhập.`,

      sec2Title: 'Cấu hình danh mục và phòng ban',
      sec2Body: `1. Vào "Quản trị hệ thống > Danh mục tài sản": thêm/sửa/ẩn danh mục; thiết lập thuộc tính khấu hao, đơn vị tính (cái, m², bộ...).
2. Vào "Quản trị hệ thống > Phòng ban": cập nhật cơ cấu tổ chức khi có thay đổi; đảm bảo mỗi phòng ban có Trưởng đơn vị đúng vai trò.
3. Danh mục đất và diện tích phòng (Đất, Phòng học, Phòng thực hành, Hội trường) không tính khấu hao — có thể nhập mà không cần giá mua.`,

      sec3Title: 'Kho vật tư',
      sec3Body: `1. Vào "Kho vật tư": quản lý danh sách vật tư tiêu hao/vật liệu; theo dõi tồn kho và phiếu nhập/xuất.
2. Xử lý phiếu nhập kho khi có mua sắm mới; xuất kho khi bàn giao/sử dụng.
3. Đây là menu chỉ dành cho Quản trị viên — các vai trò khác không thấy mục này.`,

      sec4Title: 'Mua sắm và cấp phát',
      sec4Body: `1. Vào "Mua sắm": xem và xử lý các đề nghị mua sắm từ các đơn vị; theo dõi tiến độ thực hiện.
2. Phê duyệt hoặc từ chối đề nghị; nhập kết quả mua sắm khi hoàn thành.
3. Cấp phát tài sản/vật tư cho phòng ban sau khi nhập kho; đảm bảo số liệu khớp với hồ sơ kế toán.`,

      sec5Title: 'Phê duyệt điều chuyển và sửa chữa',
      sec5Body: `1. Admin và Trưởng đơn vị đều có quyền phê duyệt phiếu điều chuyển tài sản.
2. Với yêu cầu sửa chữa/bảo trì: xử lý cấp trường sau khi Trưởng đơn vị duyệt cấp 1.
3. Can thiệp khi phiếu chờ quá lâu hoặc hai đơn vị có vướng mắc chưa giải quyết.`,

      sec6Title: 'Nhật ký hệ thống và an toàn dữ liệu',
      sec6Body: `1. Vào "Quản trị hệ thống > Nhật ký": kiểm tra lịch sử thao tác khi cần xác minh ai đã thay đổi dữ liệu nào.
2. Đảm bảo sao lưu cơ sở dữ liệu định kỳ theo quy trình của đơn vị.
3. Khi có yêu cầu thay đổi quy trình hoặc phân quyền: thực hiện trong code/cấu hình; thông báo cho người dùng liên quan.`,
    },

    block1Title: 'Tài sản & mã QR',
    block1a: 'Thêm, sửa, tra cứu tài sản; lọc theo phòng ban, danh mục, trạng thái.',
    block1b: 'Xuất / nhập Excel (quyền quản trị); tạo và in mã QR gắn tài sản.',
    block1c: 'Xem lịch sử thay đổi và thông tin khấu hao trên từng tài sản.',
    block2Title: 'Điều chuyển & luân chuyển',
    block2a: 'Tạo đề nghị điều chuyển (viên chức / Admin); Trưởng đơn vị hoặc Admin phê duyệt.',
    block2b: 'Danh sách tài sản cập nhật theo phòng ban hiện tại sau khi hoàn tất.',
    block3Title: 'Kiểm kê & thanh lý',
    block3a: 'Tạo đợt kiểm kê, quét QR khi kiểm đếm, xem báo cáo lệch.',
    block3b: 'Luồng đề nghị thanh lý / tiêu hủy theo quy định đơn vị.',
    block4Title: 'Báo cáo & phân quyền',
    block4a: 'Báo cáo tổng hợp theo phòng ban, danh mục; xuất file khi được phép.',
    block4b: 'Admin: người dùng, phòng ban, kho vật tư, mua sắm, nhật ký và quản trị hệ thống.',
    tip: 'Quy trình giấy tờ, hội đồng, ngưỡng giá trị phê duyệt và biểu mẫu riêng của trường có thể chi tiết hơn quy định trên phần mềm — vui lòng bổ sung trong quy chế nội bộ và đào tạo thêm tại đơn vị. Liên hệ Quản trị viên khi cần chỉnh quyền hoặc cấu hình.',
  },

  helpSupport: {
    title: 'Hỗ trợ sử dụng',
    subtitle: 'Kênh liên hệ và một số câu hỏi thường gặp. Thông tin dưới đây có thể được quản trị viên cập nhật theo đơn vị.',
    contactTitle: 'Liên hệ kỹ thuật',
    contactLabel: 'Bộ phận IT / Quản trị hệ thống',
    contactHint: 'Giờ làm việc: theo lịch hành chính đơn vị. Ưu tiên gửi email kèm mô tả lỗi và ảnh chụp màn hình.',
    emailLabel: 'Email:',
    phoneLabel: 'Điện thoại:',
    faqTitle: 'Câu hỏi thường gặp',
    faq1q: 'Quên mật khẩu thì làm sao?',
    faq1a: 'Liên hệ quản trị viên hệ thống để được cấp lại hoặc đặt mật khẩu mới. Không chia sẻ mật khẩu qua kênh không bảo mật.',
    faq2q: 'Không thấy menu hoặc tài sản của phòng ban khác?',
    faq2a: 'Phần mềm giới hạn dữ liệu theo vai trò và phòng ban. Nếu cần quyền xem thêm, trưởng đơn vị hoặc quản trị viên sẽ điều chỉnh phân quyền.',
    faq3q: 'Lỗi khi tải trang hoặc lưu dữ liệu?',
    faq3a: 'Thử tải lại trang, xóa cache trình duyệt hoặc dùng trình duyệt khác. Nếu vẫn lỗi, gửi email hỗ trợ kèm thời gian xảy ra và tài khoản đăng nhập (không gửi mật khẩu).',
  },

  // Stock
  stock: {
    history: 'Lịch sử kho',
  },

  // Inventory
  inventory: {
    title: 'Kiểm kê tài sản',
    roundDetail: 'Chi tiết đợt kiểm kê',
    conduct: 'Thực hiện kiểm kê',
    reportDetail: 'Chi tiết báo cáo kiểm kê',
    roundStatus: {
      not_started: 'Chưa bắt đầu',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      awaiting_approval: 'Chờ duyệt',
    },
    reportStatus: {
      draft: 'Bản nháp',
      pending: 'Chờ duyệt',
      approved_by_head: 'Trưởng Đơn vị đã duyệt',
      approved_by_admin: 'Quản trị viên đã duyệt',
      completed: 'Hoàn thành',
      rejected_by_head: 'Trưởng Đơn vị từ chối',
      rejected_by_admin: 'Quản trị viên từ chối',
    },
  },

  // Dashboard
  dashboard: {
    title: 'Bảng điều khiển',
    overview: 'Tổng quan',
    approvals: 'Phê duyệt',
    reports: 'Báo cáo',
    activity: 'Hoạt động',
    pendingApprovals: 'Yêu cầu cần duyệt',
    noPendingApprovals: 'Không có yêu cầu nào cần duyệt',
    viewDetails: 'Xem chi tiết',
    recentActivity: 'Hoạt động gần đây',
    assetNetwork: 'Mạng lưới tài sản thông minh',
  },

  // Auth
  auth: {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    email: 'Email',
    forgotPassword: 'Quên mật khẩu?',
    rememberMe: 'Ghi nhớ đăng nhập',
    loginSuccess: 'Đăng nhập thành công',
    logoutSuccess: 'Đăng xuất thành công',
    loginFailed: 'Đăng nhập thất bại',
    pleaseLogin: 'Vui lòng đăng nhập để tiếp tục',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    enterUsername: 'Nhập tên đăng nhập',
    enterPassword: 'Nhập mật khẩu',
    passwordMinLength: 'Mật khẩu phải có ít nhất 6 ký tự',
    changePassword: 'Đổi mật khẩu',
    oldPassword: 'Mật khẩu cũ',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu mới',
  },

  // Categories
  categories: {
    // Danh mục chính theo Phụ lục I
    building: 'Nhà, công trình xây dựng',
    structure: 'Vật kiến trúc',
    car: 'Xe ô tô',
    vehicle: 'Phương tiện vận tải khác',
    equipment: 'Máy móc, thiết bị',
    other_tangible: 'Tài sản cố định hữu hình khác',
    tools: 'Công cụ dụng cụ',
    // Danh mục theo loại quản lý
    fixed_asset: 'Tài sản cố định',
    project_asset: 'Tài sản dự án',
    // Legacy categories (for old data)
    electronics: 'Thiết bị điện tử',
    furniture: 'Nội thất',
    software: 'Phần mềm',
    other: 'Khác',
  },

  // Assets
  assets: {
    title: 'Quản lý tài sản',
    addAsset: 'Thêm tài sản',
    editAsset: 'Sửa tài sản',
    assetDetail: 'Chi tiết tài sản',
    assetCode: 'Mã tài sản',
    assetName: 'Tên tài sản',
    category: 'Danh mục',
    department: 'Phòng ban',
    purchaseDate: 'Ngày mua',
    purchasePrice: 'Giá mua (VNĐ)',
    currentValue: 'Giá trị hiện tại',
    serialNumber: 'Số serial',
    warrantyDate: 'Ngày hết bảo hành',
    warrantyExpired: 'Hết bảo hành',
    warrantyValid: 'Còn bảo hành',
    depreciation: 'Hao mòn',
    location: 'Vị trí',
    detailLocation: 'Vị trí chi tiết',
    description: 'Mô tả',
    assetType: 'Loại tài sản',
    assetTypePlaceholder: 'VD: Laptop, Máy in, Bàn ghế...',
    imageUrl: 'Ảnh tài sản',
    basicInfo: 'Thông tin cơ bản',
    locationInfo: 'Vị trí & Phòng ban',
    financialInfo: 'Thông tin tài chính',
    locationPlaceholder: 'VD: Phòng 301, Tầng 3, Tòa nhà A',
    // Thông tin hao mòn (thiết bị, tài sản cố định)
    depreciationInfo: 'Thông tin hao mòn',
    usefulLife: 'Thời gian sử dụng',
    annualDepreciationRate: 'Tỷ lệ hao mòn/năm',
    yearsUsed: 'Số năm đã sử dụng',
    remainingUsefulLife: 'Thời gian sử dụng còn lại',
    depreciationProgress: 'Tiến độ hao mòn',
    annualDepreciation: 'Mức hao mòn/năm',
    accumulatedDepreciation: 'Hao mòn lũy kế',
    calculatedCurrentValue: 'Giá trị còn lại (tính toán)',
    fullyDepreciated: 'Đã hao mòn hết',
    nonDepreciable: 'Không tính hao mòn',
    nonDepreciableDesc:
      'Không khấu hao theo tỷ lệ năm. Trong vòng 3 năm dương lịch kể từ năm đưa vào sử dụng, giá trị còn lại bằng nguyên giá; sau đó giá trị còn lại là 0.',
    depreciationRateLabel: 'Tỷ lệ hao mòn (%/năm)',
    hasDepreciation: 'Có hao mòn',
    status: {
      active: 'Đang sử dụng',
      inactive: 'Không sử dụng',
      damaged: 'Hỏng',
      lost: 'Mất',
      disposed: 'Đã thanh lý',
      pending_repair: 'Đang đề nghị sửa chữa',
      pending_disposal: 'Đang đề nghị thanh lý',
    },
    deleteConfirm: 'Bạn có chắc chắn muốn xóa tài sản này?',
    deleteSuccess: 'Xóa tài sản thành công',
    createSuccess: 'Thêm tài sản thành công',
    updateSuccess: 'Cập nhật tài sản thành công',
    searchPlaceholder: 'Tìm kiếm theo mã hoặc tên tài sản...',
    filterByCategory: 'Lọc theo danh mục',
    filterByStatus: 'Lọc theo trạng thái',
    filterByDepartment: 'Lọc theo phòng ban',
  },

  // Departments
  departments: {
    title: 'Quản lý phòng ban',
    addDepartment: 'Thêm phòng ban',
    editDepartment: 'Sửa phòng ban',
    departmentName: 'Tên phòng ban',
    departmentCode: 'Mã phòng ban',
    departmentType: 'Loại phòng ban',
    departmentDetails: 'Chi tiết phòng ban',
    manager: 'Trưởng phòng',
    parentDepartment: 'Phòng ban cha',
    description: 'Mô tả',
    type: 'Loại',
    types: {
      department: 'Phòng',
      faculty: 'Khoa',
      center: 'Trung tâm',
      classroom: 'Phòng học',
      lab: 'Phòng thực hành',
      meeting_room: 'Phòng họp',
      hall: 'Hội trường',
    },
    deleteConfirm: 'Bạn có chắc chắn muốn xóa phòng ban này?',
    deleteSuccess: 'Xóa phòng ban thành công',
    createSuccess: 'Thêm phòng ban thành công',
    updateSuccess: 'Cập nhật phòng ban thành công',
    searchPlaceholder: 'Tìm kiếm phòng ban...',
    filterByType: 'Lọc theo loại',
  },

  // Users
  users: {
    title: 'Quản lý người dùng',
    addUser: 'Thêm người dùng',
    editUser: 'Sửa người dùng',
    userDetails: 'Chi tiết người dùng',
    fullname: 'Họ và tên',
    username: 'Tên đăng nhập',
    email: 'Email',
    role: 'Vai trò',
    department: 'Phòng ban',
    isActive: 'Trạng thái hoạt động',
    lastLogin: 'Lần đăng nhập cuối',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    active: 'Hoạt động',
    inactive: 'Vô hiệu hóa',
    activate: 'Kích hoạt',
    deactivate: 'Vô hiệu hóa',
    roles: {
      admin: 'Quản trị viên hệ thống',
      director: 'Giám Hiệu',
      department_head: 'Trưởng Đơn Vị',
      manager: 'Quản lý',
      staff: 'Viên Chức',
      user: 'Người dùng',
    },
    deleteConfirm: 'Bạn có chắc chắn muốn xóa người dùng này?',
    deleteSuccess: 'Xóa người dùng thành công',
    createSuccess: 'Thêm người dùng thành công',
    updateSuccess: 'Cập nhật người dùng thành công',
    searchPlaceholder: 'Tìm kiếm người dùng...',
    filterByRole: 'Lọc theo vai trò',
    filterByStatus: 'Lọc theo trạng thái',
    toggleStatusConfirm: 'Bạn có chắc chắn muốn {action} người dùng này?',
    resetPassword: 'Đặt lại mật khẩu',
    resetPasswordConfirm: 'Bạn có chắc chắn muốn đặt lại mật khẩu về mặc định cho người dùng này?',
    resetPasswordSuccess: 'Đặt lại mật khẩu thành công',
  },

  // Dashboard
  dashboard: {
    title: 'Bảng điều khiển',
    welcome: 'Chào mừng đến với Hệ thống Quản lý Tài sản',
    totalAssets: 'Tổng tài sản',
    totalDepartments: 'Tổng phòng ban',
    totalUsers: 'Tổng người dùng',
    recentAssets: 'Tài sản gần đây',
    assetsByCategory: 'Tài sản theo danh mục',
    assetsByStatus: 'Tài sản theo trạng thái',
    assetsByDepartment: 'Tài sản theo phòng ban',
    quickStats: 'Thống kê nhanh',
    activeAssets: 'Tài sản đang sử dụng',
    inactiveAssets: 'Tài sản không sử dụng',
    damagedAssets: 'Tài sản hỏng',
  },

  // Language
  language: {
    title: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    english: 'English',
  },

  // Validation
  validation: {
    required: 'Trường này là bắt buộc',
    email: 'Email không hợp lệ',
    invalidEmail: 'Email không hợp lệ',
    minLength: 'Tối thiểu {min} ký tự',
    maxLength: 'Tối đa {max} ký tự',
    stringLength: 'Độ dài phải từ {min} đến {max} ký tự',
    passwordMatch: 'Mật khẩu xác nhận không khớp',
    passwordMismatch: 'Mật khẩu xác nhận không khớp',
  },

  // Table
  table: {
    noData: 'Không có dữ liệu',
    loading: 'Đang tải...',
    itemsPerPage: 'Số mục mỗi trang',
    page: 'Trang',
    of: 'của',
    items: 'mục',
  },

  // Transfers
  transfers: {
    title: 'Điều chuyển tài sản',
    createTransfer: 'Tạo điều chuyển',
    editTransfer: 'Sửa điều chuyển',
    transferDetail: 'Chi tiết điều chuyển',
    transferList: 'Danh sách điều chuyển',
    asset: 'Tài sản',
    assetCode: 'Mã tài sản',
    assetName: 'Tên tài sản',
    fromDepartment: 'Từ phòng ban',
    toDepartment: 'Đến phòng ban',
    transferDate: 'Ngày điều chuyển',
    reason: 'Lý do',
    notes: 'Ghi chú',
    enterNotes: 'Nhập ghi chú...',
    requestedBy: 'Người yêu cầu',
    approvedBy: 'Người duyệt',
    transferStatus: 'Trạng thái điều chuyển',
    searchAsset: 'Tìm kiếm tài sản',
    enterAssetCode: 'Nhập mã tài sản',
    selectAsset: 'Chọn tài sản',
    selectDepartment: 'Chọn phòng ban',
    selectSourceDepartment: 'Chọn phòng ban nguồn',
    selectTargetDepartment: 'Chọn phòng ban đích',
    selectSourceDepartmentFirst: 'Vui lòng chọn phòng ban nguồn trước',
    selectedAssetInfo: 'Thông tin tài sản đã chọn',
    assetCount: 'Tổng số tài sản: {count}',
    transferNote: 'Sau khi điều chuyển được duyệt, tài sản sẽ tự động chuyển sang phòng ban đích và lưu vết lịch sử.',
    enterReason: 'Nhập lý do điều chuyển',
    rejectReason: 'Nhập lý do từ chối',
    sameDepartmentError: 'Phòng ban đích phải khác phòng ban hiện tại',
    status: {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
    },
    approveConfirm: 'Bạn có chắc chắn muốn duyệt điều chuyển này?',
    rejectConfirm: 'Bạn có chắc chắn muốn từ chối điều chuyển này?',
    approveSuccess: 'Duyệt điều chuyển thành công',
    rejectSuccess: 'Từ chối điều chuyển thành công',
    createSuccess: 'Tạo điều chuyển thành công',
    updateSuccess: 'Cập nhật điều chuyển thành công',
    filterByStatus: 'Lọc theo trạng thái',
    filterByDepartment: 'Lọc theo phòng ban',
    approve: 'Duyệt',
    reject: 'Từ chối',
  },

  // Maintenance - Mua sắm/Sửa chữa
  maintenance: {
    title: 'Mua sắm / Sửa chữa',
    createRequest: 'Tạo yêu cầu',
    editRequest: 'Sửa yêu cầu',
    requestDetail: 'Chi tiết yêu cầu',
    requestList: 'Danh sách yêu cầu',
    asset: 'Tài sản',
    assetCode: 'Mã tài sản',
    assetName: 'Tên tài sản',
    selectAsset: 'Chọn tài sản',
    department: 'Phòng ban',
    selectDepartment: 'Chọn phòng ban',
    requestType: 'Loại yêu cầu',
    urgency: 'Mức độ ưu tiên',
    description: 'Mô tả',
    requestedBy: 'Người yêu cầu',
    assignedTo: 'Người phụ trách',
    assignTo: 'Giao cho',
    selectAssignee: 'Chọn người xử lý',
    requestDate: 'Ngày yêu cầu',
    cost: 'Chi phí',
    estimatedCost: 'Chi phí dự kiến',
    actualCost: 'Chi phí thực tế',
    completedDate: 'Ngày hoàn thành',
    startDate: 'Ngày bắt đầu',
    selectStartDate: 'Chọn ngày bắt đầu',
    completionDate: 'Ngày hoàn thành',
    selectCompletionDate: 'Chọn ngày hoàn thành',
    notes: 'Ghi chú',
    enterNotes: 'Nhập ghi chú...',
    technicalNotes: 'Ghi chú kỹ thuật',
    resolution: 'Kết quả xử lý',
    enterDescription: 'Mô tả chi tiết',
    enterTechnicalNotes: 'Nhập ghi chú kỹ thuật',
    enterResolution: 'Nhập kết quả xử lý',
    statusTimeline: 'Tiến trình xử lý',
    approve: 'Duyệt',
    approveConfirm: 'Bạn có chắc chắn muốn duyệt yêu cầu này?',
    approveSuccess: 'Duyệt yêu cầu thành công',
    // Tabs
    tabs: {
      procurement: 'Mua sắm thiết bị',
    },
    // Procurement form
    procurement: {
      title: 'Mua sắm thiết bị',
      createRequest: 'Tạo yêu cầu mua sắm',
      editRequest: 'Sửa yêu cầu mua sắm',
      category: 'Danh mục thiết bị',
      deviceName: 'Tên máy móc, thiết bị (Model)',
      technicalSpecs: 'Tính năng kỹ thuật cơ bản',
      unit: 'Đơn vị tính',
      quantity: 'Số lượng',
      unitPrice: 'Đơn giá',
      totalPrice: 'Thành tiền',
      directUser: 'Đơn vị sử dụng trực tiếp',
      normLimit: 'Số lượng tối đa theo định mức',
      currentQuantity: 'Số lượng hiện có',
      justification: 'Thuyết minh nhu cầu mua sắm',
      categories: {
        lab: 'Thiết bị thí nghiệm thực hành',
        it: 'Thiết bị CNTT',
        projection: 'Thiết bị chiếu sáng',
        office: 'Thiết bị văn phòng',
        electronic: 'Thiết bị điện tử',
        other: 'Thiết bị chuyên dùng khác',
        furniture: 'Bàn ghế',
      },
    },
    types: {
      repair: 'Sửa chữa',
      maintenance: 'Bảo trì định kỳ',
      upgrade: 'Nâng cấp',
      inspection: 'Kiểm tra',
      procurement: 'Mua sắm thiết bị',
    },
    urgency_level: {
      low: 'Thấp',
      normal: 'Bình thường',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Khẩn cấp',
    },
    status: {
      new: 'Chờ phê duyệt',
      pending: 'Chờ phê duyệt',
      approved: 'Đã duyệt',
      in_progress: 'Đang xử lý',
      done: 'Hoàn thành',
      completed: 'Hoàn thành',
      rejected: 'Từ chối',
      cancelled: 'Đã hủy',
    },
    createSuccess: 'Tạo yêu cầu thành công',
    updateSuccess: 'Cập nhật yêu cầu thành công',
    deleteSuccess: 'Xóa yêu cầu thành công',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa yêu cầu này?',
    filterByUrgency: 'Lọc theo mức độ ưu tiên',
    filterByStatus: 'Lọc theo trạng thái',
    filterByType: 'Lọc theo loại yêu cầu',
    filterByDepartment: 'Lọc theo phòng ban',
    startProgress: 'Bắt đầu xử lý',
    startWork: 'Bắt đầu thực hiện',
    startSuccess: 'Đã bắt đầu thực hiện thành công',
    markComplete: 'Đánh dấu hoàn thành',
  },

  // Reports
  reports: {
    title: 'Báo cáo thường niên',
    createReport: 'Tạo báo cáo',
    editReport: 'Sửa báo cáo',
    reportDetail: 'Chi tiết báo cáo',
    reportList: 'Danh sách báo cáo',
    department: 'Phòng ban',
    year: 'Năm',
    totalAssets: 'Tổng tài sản',
    activeAssets: 'Tài sản hoạt động',
    damagedAssets: 'Tài sản hỏng',
    lostAssets: 'Tài sản mất',
    totalValue: 'Tổng giá trị',
    notes: 'Ghi chú',
    selectDepartment: 'Chọn phòng ban',
    selectYear: 'Chọn năm',
    selectDepartmentFirst: 'Vui lòng chọn phòng ban trước',
    enterNotes: 'Nhập ghi chú...',
    assetStatistics: 'Thống kê tài sản',
    autoCalculate: 'Tự động tính toán',
    autoCalculateHint: 'Tự động lấy số liệu từ danh sách tài sản của phòng ban',
    calculateSuccess: 'Tính toán số liệu thành công',
    purposeAndWorkflow:
      'Mục đích: tổng hợp số liệu tài sản theo từng phòng ban và năm (tính đến cuối năm) để lưu hồ sơ và đối chiếu cấp trường. Mở “Xem” chi tiết để xem thêm tổng hợp phát sinh trong năm: điều chuyển, mua sắm/sửa chữa, tăng tài sản, thanh lý, kiểm kê… Quy trình: Trưởng đơn vị hoặc Quản trị tạo báo cáo → chỉnh số liệu/ghi chú → Gửi duyệt; Quản trị hoặc Giám hiệu phê duyệt hoặc từ chối. Viên chức thường chỉ xem báo cáo của đơn vị mình.',
    detailIntro:
      'Đây là báo cáo thường niên theo đơn vị và năm. Số liệu thống kê được lấy từ danh mục tài sản gắn với phòng ban tại thời điểm tính (cuối năm báo cáo), có thể chỉnh tay trước khi gửi duyệt.',
    statisticsBasis:
      'Cơ sở số liệu: tài sản thuộc phòng ban, có ngày mua không sau ngày cuối năm báo cáo (hoặc chưa khai báo ngày mua).',
    workflowRoles: 'Ai làm việc gì',
    roleInitiator: 'Khởi tạo & gửi',
    roleInitiatorDesc: 'Trưởng đơn vị hoặc Quản trị viên (tạo bản nháp, cập nhật số liệu, gửi duyệt).',
    roleApprover: 'Phê duyệt',
    roleApproverDesc: 'Quản trị viên hoặc Giám hiệu (duyệt hoặc từ chối sau khi báo cáo đã được gửi).',
    createdBy: 'Người khởi tạo',
    submittedBy: 'Người gửi duyệt',
    submittedAt: 'Thời điểm gửi duyệt',
    approvedBy: 'Người phê duyệt',
    approvedAt: 'Thời điểm phê duyệt',
    rejectedBy: 'Người từ chối',
    rejectedAt: 'Thời điểm từ chối',
    notesEmpty: 'Không có ghi chú.',
    statusHistory: 'Lịch sử trạng thái',
    draftDescription: 'Báo cáo được tạo ở trạng thái nháp; có thể chỉnh số liệu trước khi gửi.',
    submittedDescription: 'Báo cáo đã được gửi để duyệt',
    submittedDescriptionDetail: 'Đã gửi chờ phê duyệt. Người gửi: {name}.',
    approvedDescription: 'Báo cáo đã được duyệt và chính thức',
    approvedDescriptionDetail: 'Báo cáo đã được chấp thuận. Người phê duyệt: {name}.',
    rejectedDescriptionDetail: 'Báo cáo không được chấp thuận. Người xử lý: {name}.',
    status: {
      draft: 'Nháp',
      submitted: 'Đã gửi',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    },
    submit: 'Gửi duyệt',
    approve: 'Duyệt',
    reject: 'Từ chối',
    submitConfirm: 'Bạn có chắc chắn muốn gửi báo cáo này để duyệt?',
    approveConfirm: 'Bạn có chắc chắn muốn duyệt báo cáo này?',
    rejectConfirm: 'Nhập lý do từ chối báo cáo này:',
    rejectReasonHint: 'Nhập lý do từ chối…',
    submitSuccess: 'Gửi báo cáo thành công',
    approveSuccess: 'Duyệt báo cáo thành công',
    rejectSuccess: 'Từ chối báo cáo thành công',
    createSuccess: 'Tạo báo cáo thành công',
    updateSuccess: 'Cập nhật báo cáo thành công',
    deleteSuccess: 'Xóa báo cáo thành công',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa báo cáo này?',
    filterByYear: 'Lọc theo năm',
    filterByStatus: 'Lọc theo trạng thái',
    filterByDepartment: 'Lọc theo phòng ban',
    scopeUnitOnly: 'Danh sách chỉ hiển thị báo cáo của đơn vị bạn (hệ thống tự lọc).',
    adminListHint:
      'Quản trị / Giám hiệu: để xem toàn bộ báo cáo các phòng ban, không cần chọn phòng ban. Chỉ chọn phòng ban khi muốn thu hẹp.',
    bulkApprove: 'Duyệt đã chọn',
    bulkApproveConfirm:
      'Chỉ các báo cáo đã gửi duyệt (trạng thái “Đã gửi”) mới được phê duyệt. Các dòng khác sẽ bị bỏ qua hoặc báo lỗi trong kết quả. Tiếp tục?',
    bulkApproveSuccess: 'Đã xử lý duyệt hàng loạt',
    bulkApproveDetail: 'Duyệt: {ok}, Bỏ qua (đã duyệt): {skip}, Không duyệt được: {fail}',
    bulkApproveNoSelection: 'Vui lòng chọn ít nhất một báo cáo đang chờ duyệt',
    bulkApproveFailedHint:
      'Một số dòng không duyệt được: chỉ báo cáo đã gửi duyệt (không phải nháp) mới được phê duyệt. Kiểm tra cột trạng thái.',

    yearSummary: {
      title: 'Tổng hợp hoạt động đơn vị trong năm báo cáo',
      lead:
        'Phần dưới gom số liệu từ các module: tài sản (đầy đủ trạng thái), điều chuyển, đề nghị mua/sửa, phiếu tăng tài sản, hồ sơ thanh lý/tiêu hủy, kiểm kê, và tài sản mới/ghi nhận trong năm.',
      stockExcluded:
        'Lưu ý: xuất/nhập kho vật tư trung tâm không gắn trực tiếp theo từng phòng ban nên không có trong báo cáo này.',
      snapshotTitle: '1. Ảnh chụp tài sản (cuối năm — cùng logic báo cáo)',
      snapshotScope:
        'Đếm tài sản thuộc phòng ban, ngày mua không sau 31/12 năm báo cáo (hoặc chưa khai báo ngày mua). Phân theo trạng thái hiện tại trên hệ thống.',
      activityTitle: '2. Phát sinh trong năm dương lịch (1/1 — 31/12)',
      activityScope:
        'Đếm bản ghi có thời điểm tạo (created_at) trong năm, theo đơn vị liên quan (phòng ban đề nghị / nhận / nguồn gốc hồ sơ…).',
      totalInScope: 'Tổng số tài sản trong phạm vi',
      totalValueLive: 'Tổng giá trị (tính lại từ dữ liệu hiện tại)',
      byAssetStatus: 'Chi tiết theo trạng thái tài sản',
      colStatus: 'Trạng thái / loại',
      colCount: 'Số lượng',
      colType: 'Loại',
      transfers: 'Điều chuyển tài sản',
      transferTotal: 'Phiếu liên quan đơn vị',
      transferOut: 'Xuất từ đơn vị',
      transferIn: 'Nhập vào đơn vị',
      maintenance: 'Đề nghị mua sắm / sửa chữa (maintenance)',
      maintTotal: 'Tổng phiếu',
      maintRepair: 'Sửa chữa',
      maintProcurement: 'Mua sắm / cấp phát',
      procurements: 'Phiếu tăng tài sản (Procurement)',
      procTotal: 'Tổng phiếu (đơn vị nhận)',
      disposals: 'Hồ sơ thanh lý / tiêu hủy',
      dispTotal: 'Tổng hồ sơ (đơn vị nguồn)',
      byCaseStatus: 'Theo trạng thái hồ sơ',
      byDisposalType: 'Theo hình thức (thanh lý / tiêu hủy)',
      inventory: 'Báo cáo kiểm kê',
      invCount: 'Số báo cáo',
      invDiscSum: 'Tổng chênh lệch (cộng dồn)',
      invDispSuggestSum: 'Tổng đề nghị thanh lý (cộng dồn)',
      newAssets: 'Tài sản ghi nhận / mua trong năm',
      newAssetsScope:
        'Số tài sản hiện thuộc đơn vị và có ngày tạo bản ghi hoặc ngày mua nằm trong năm báo cáo.',
      newAssetsCount: 'Số lượng',

      assetStatus: {
        active: 'Đang sử dụng',
        inactive: 'Không sử dụng',
        damaged: 'Hỏng',
        lost: 'Mất',
        disposed: 'Đã thanh lý',
        pending_disposal: 'Đang đề nghị thanh lý',
        pending_repair: 'Đang đề nghị sửa chữa',
      },
      transferStatus: {
        pending: 'Chờ xử lý',
        approved_by_head: 'Trưởng đơn vị đã duyệt',
        approved: 'Đã duyệt',
        rejected: 'Từ chối',
        rejected_by_head: 'Trưởng đơn vị từ chối',
        completed: 'Hoàn thành',
        '—': '(Trống)',
      },
      maintStatus: {
        draft: 'Nháp',
        new: 'Chờ phê duyệt',
        pending: 'Chờ phê duyệt',
        approved: 'Đã duyệt',
        approved_by_head: 'Trưởng Đơn vị đã duyệt',
        approved_by_admin: 'Quản trị viên đã duyệt',
        approved_by_director: 'Giám hiệu đã duyệt',
        in_progress: 'Đang thực hiện',
        repair_completed: 'Sửa xong, chờ duyệt',
        repair_approved: 'Đã duyệt hoàn thành sửa',
        completed: 'Hoàn thành',
        rejected: 'Từ chối',
        rejected_by_head: 'Trưởng Đơn vị từ chối',
        rejected_by_admin: 'Quản trị viên từ chối',
        rejected_by_director: 'Giám hiệu từ chối',
        rejected_due_to_high_cost: 'Từ chối (chi phí cao)',
        '—': '(Trống)',
      },
      procurementStatus: {
        draft: 'Nháp',
        fulfilled: 'Đã hoàn tất',
        cancelled: 'Đã hủy',
        '—': '(Trống)',
      },
      disposalCaseStatus: {
        pending: 'Đang xử lý',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
        '—': '(Trống)',
      },
      disposalType: {
        liquidation: 'Thanh lý',
        destruction: 'Tiêu hủy',
        '—': '(Chưa ghi)',
      },
      inventoryReportStatus: {
        draft: 'Bản nháp',
        pending: 'Chờ duyệt',
        approved_by_head: 'Trưởng đơn vị đã duyệt',
        approved_by_admin: 'Quản trị đã duyệt',
        rejected_by_head: 'Trưởng đơn vị từ chối',
        rejected_by_admin: 'Quản trị từ chối',
        completed: 'Hoàn thành',
        '—': '(Trống)',
      },
    },
  },

  // Procurement (Tăng/Giảm tài sản - mua sắm)
  procurement: {
    status: {
      draft: 'Nháp',
      fulfilled: 'Đã hoàn tất',
      cancelled: 'Đã hủy',
    },
  },

  // Asset disposals
  assetDisposals: {
    subtitle: 'Danh sách hồ sơ thanh lý / tiêu hủy tài sản',
    createCase: 'Tạo hồ sơ tiêu hủy / thanh lý',
    searchPlaceholder: 'Tìm theo mã hồ sơ',
    caseCode: 'Mã hồ sơ',
    status: {
      pending: 'Chờ xử lý',
      completed: 'Đã hoàn tất',
      cancelled: 'Đã hủy',
    },
  },
};
