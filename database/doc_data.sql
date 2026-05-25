USE DocumentDB;
GO

-- Xóa dữ liệu cũ
DELETE FROM Interactions;
DELETE FROM SearchLogs;
DELETE FROM DocTags;
DELETE FROM Documents;
DELETE FROM Tags;
DELETE FROM Categories;
DELETE FROM Users;
DELETE FROM DeletedDocumentsLog;
DELETE FROM SystemLogs;
GO

---------------------------------------------------------
-- 1. INSERT USERS
-- Password dạng plain-text để demo dễ dàng (123456)
---------------------------------------------------------
INSERT INTO Users (Username, PasswordHash, FullName, Email, Role) VALUES
('admin',   '123456', N'Quản trị viên Hệ thống', 'admin@docsys.com',   'Admin'),
('thinh',   '123456', N'Nguyễn Văn Thịnh',        'thinh@mail.com',     'User'),
('huong',   '123456', N'Trần Thu Hương',           'huong@mail.com',     'User'),
('minh',    '123456', N'Lê Quang Minh',            'minh@mail.com',      'User'),
('an',      '123456', N'Hoàng Trường An',          'an@mail.com',        'User'),
('linh',    '123456', N'Phạm Mỹ Linh',             'linh@mail.com',      'User'),
('tuan',    '123456', N'Võ Hoàng Tuấn',            'tuan@mail.com',      'User'),
('editor1', '123456', N'Trưởng ban Biên tập',      'editor1@docsys.com', 'Editor');
GO

---------------------------------------------------------
-- 2. INSERT CATEGORIES
---------------------------------------------------------
INSERT INTO Categories (CatName, Description) VALUES
(N'Công nghệ thông tin', N'Tài liệu về lập trình, mạng, bảo mật, AI, Cloud'),
(N'Kinh tế - Tài chính', N'Tài liệu về quản trị kinh doanh, kế toán, chứng khoán'),
(N'Văn học nghệ thuật',  N'Tiểu thuyết, thơ, truyện ngắn, phê bình văn học'),
(N'Khoa học đời sống',   N'Y học, sinh học, môi trường, vật lý ứng dụng'),
(N'Luật - Pháp lý',      N'Văn bản luật, nghị định, thông tư, hợp đồng mẫu'),
(N'Kỹ năng mềm',         N'Giao tiếp, thuyết trình, quản lý thời gian');
GO

---------------------------------------------------------
-- 3. INSERT TAGS
---------------------------------------------------------
INSERT INTO Tags (TagName) VALUES
(N'Lập trình Web'),       -- 1
(N'Cơ sở dữ liệu'),      -- 2
(N'AI'),                  -- 3
(N'Marketing online'),    -- 4
(N'Đầu tư chứng khoán'), -- 5
(N'Bảo mật mạng'),       -- 6
(N'Blockchain'),          -- 7
(N'Machine Learning'),    -- 8
(N'Tiểu thuyết'),         -- 9
(N'Luật doanh nghiệp'),  -- 10
(N'ReactJS'),             -- 11
(N'Node.js'),             -- 12
(N'Tâm lý học'),          -- 13
(N'Giao tiếp hiệu quả'), -- 14
(N'Kinh tế vĩ mô');      -- 15
GO

---------------------------------------------------------
-- 4. INSERT DOCUMENTS (AuthorID 1-8 tương ứng users đã insert)
---------------------------------------------------------
INSERT INTO Documents (Title, Summary, Content, AuthorID, CategoryID, ViewCount, PostDate) VALUES
(
  N'Hướng dẫn cơ bản về SQL Server',
  N'Tìm hiểu cách tạo và quản lý cơ sở dữ liệu với SQL Server từ A đến Z.',
  N'SQL Server là một hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) do Microsoft phát triển. Trong bài viết này, chúng ta sẽ tìm hiểu các khái niệm cơ bản như Table, View, Stored Procedure, Trigger và cách phân quyền người dùng. SQL Server hỗ trợ T-SQL - một ngôn ngữ mở rộng của SQL tiêu chuẩn với nhiều tính năng mạnh mẽ như Transaction, Cursor, và Error Handling. Đây là nền tảng không thể thiếu cho bất kỳ lập trình viên backend nào làm việc trong môi trường Windows và .NET.',
  1, 1, 150, DATEADD(day, -30, GETDATE())
),
(
  N'Lập trình Web với Node.js',
  N'Cách xây dựng backend API RESTful với Express.js và kết nối SQL Server.',
  N'Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng các ứng dụng web tốc độ cao với I/O không đồng bộ. Bài viết hướng dẫn xây dựng RESTful API hoàn chỉnh với Express.js, bao gồm: routing, middleware, kết nối cơ sở dữ liệu, xác thực JWT, và triển khai lên môi trường production. Chúng ta cũng sẽ tìm hiểu cách xử lý lỗi, ghi log, và tối ưu performance cho API. Node.js đang là lựa chọn hàng đầu cho backend của các startup công nghệ toàn cầu.',
  2, 1, 200, DATEADD(day, -25, GETDATE())
),
(
  N'Phân tích chứng khoán cơ bản',
  N'Những chỉ số tài chính quan trọng cần nắm vững trước khi đầu tư.',
  N'Phân tích cơ bản (Fundamental Analysis) là phương pháp đánh giá giá trị nội tại của một cổ phiếu dựa trên các yếu tố kinh tế, tài chính và yếu tố định tính. Các chỉ số quan trọng bao gồm: P/E (Price-to-Earnings), EPS (Earnings Per Share), ROA (Return on Assets), ROE (Return on Equity), P/B (Price-to-Book). Ngoài ra, nhà đầu tư cần đọc hiểu Báo cáo Kết quả Kinh doanh, Bảng Cân đối Kế toán và Báo cáo Lưu chuyển Tiền tệ. Kỷ luật và kiên nhẫn là hai yếu tố quyết định thành công dài hạn trên thị trường chứng khoán.',
  3, 2, 500, DATEADD(day, -20, GETDATE())
),
(
  N'Tổng quan về AI và Machine Learning năm 2026',
  N'Sự phát triển vượt bậc của trí tuệ nhân tạo và tác động đến ngành CNTT.',
  N'Năm 2026 chứng kiến sự bùng nổ của các mô hình ngôn ngữ lớn (Large Language Models - LLMs) với khả năng xử lý ngôn ngữ tự nhiên vượt trội. Machine Learning đã không còn là đặc quyền của các nhà khoa học mà đã trở thành công cụ phổ thông cho developer. Các framework phổ biến như TensorFlow, PyTorch, và Hugging Face Transformers giúp việc huấn luyện và triển khai mô hình trở nên dễ dàng hơn bao giờ hết. Tuy nhiên, đi kèm với sự phát triển này là hàng loạt câu hỏi về đạo đức AI, bảo mật dữ liệu và tương lai của thị trường lao động.',
  4, 1, 820, DATEADD(day, -10, GETDATE())
),
(
  N'Bảo mật mạng cấp độ doanh nghiệp',
  N'Các giải pháp và kiến trúc bảo mật cho hệ thống doanh nghiệp hiện đại.',
  N'An ninh mạng (Cybersecurity) là ưu tiên hàng đầu của mọi tổ chức trong thời đại số. Bài viết này trình bày kiến trúc bảo mật đa lớp (Defense in Depth) bao gồm: Firewall thế hệ mới (NGFW), Hệ thống phát hiện xâm nhập (IDS/IPS), Zero Trust Network Access (ZTNA), và Quản lý định danh đặc quyền (PAM). Chúng ta cũng thảo luận về các mối đe dọa phổ biến như Ransomware, Phishing, và Social Engineering, cùng với các biện pháp phòng chống hiệu quả. Security Awareness Training cho nhân viên là yếu tố thường bị bỏ qua nhưng lại cực kỳ quan trọng.',
  8, 1, 120, DATEADD(day, -15, GETDATE())
),
(
  N'Blockchain, Web3 và Tương lai của Internet',
  N'Sự chuyển dịch của mạng internet sang mô hình phi tập trung.',
  N'Blockchain là công nghệ sổ cái phân tán (Distributed Ledger Technology) cho phép ghi chép giao dịch một cách minh bạch và bất biến mà không cần bên trung gian. Web3 đại diện cho thế hệ internet tiếp theo, nơi người dùng thực sự sở hữu dữ liệu và tài sản kỹ thuật số của mình thông qua NFT, DeFi và DAO. Smart Contract trên Ethereum cho phép thực thi các thỏa thuận tự động không cần niềm tin (trustless). Mặc dù công nghệ còn đang phát triển và có nhiều thách thức về khả năng mở rộng (scalability) và tiêu thụ năng lượng, tiềm năng dài hạn của Blockchain là không thể phủ nhận.',
  2, 1, 350, DATEADD(day, -5, GETDATE())
),
(
  N'Luật Doanh nghiệp 2026 - Những điểm sửa đổi quan trọng',
  N'Tổng hợp các quy định mới nhất về thành lập và hoạt động của doanh nghiệp.',
  N'Luật Doanh nghiệp sửa đổi năm 2026 mang đến nhiều thay đổi đáng kể nhằm tạo môi trường kinh doanh thông thoáng hơn cho doanh nghiệp. Các điểm nổi bật bao gồm: đơn giản hóa thủ tục đăng ký thành lập, quy định mới về vốn điều lệ tối thiểu, cơ chế bảo vệ cổ đông thiểu số được tăng cường, và các quy định về quản trị công ty theo chuẩn quốc tế. Doanh nghiệp cũng cần lưu ý các nghĩa vụ mới về báo cáo môi trường (ESG) và trách nhiệm xã hội doanh nghiệp (CSR) theo xu hướng phát triển bền vững toàn cầu.',
  1, 5, 45, DATEADD(day, -2, GETDATE())
),
(
  N'Tâm lý học hành vi trong Marketing hiện đại',
  N'Cách ứng dụng nguyên lý tâm lý học để tối ưu hóa chiến lược bán hàng.',
  N'Marketing hiện đại không chỉ là quảng cáo mà là sự kết hợp tinh tế giữa dữ liệu và tâm lý học con người. Các nguyên lý quan trọng bao gồm: Hiệu ứng Chim Mồi (Decoy Effect) giúp khách hàng chọn gói sản phẩm mong muốn, Hiệu ứng Khan hiếm (Scarcity) tạo động lực mua ngay, FOMO (Fear of Missing Out) trong Marketing mạng xã hội, và Social Proof thông qua đánh giá, review của người dùng. Kết hợp với công cụ như A/B Testing và Phân tích hành vi người dùng, các marketer ngày nay có thể cá nhân hóa trải nghiệm khách hàng ở mức độ chưa từng có.',
  5, 2, 90, DATEADD(day, -60, GETDATE())
),
(
  N'Tiểu thuyết: Ánh Trăng Dối Lừa - Chương 1',
  N'Câu chuyện về tình yêu và phản bội dưới ánh trăng mùa thu.',
  N'Đêm hôm đó, Linh đứng trên ban công căn hộ nhỏ nhìn xuống con phố vắng tanh. Ánh trăng vàng vọt trải dài trên mặt đường ướt sũng sau cơn mưa, tạo ra những đốm sáng lung linh giống như hàng ngàn viên kim cương tan chảy. Cô giơ tay ôm chặt lấy chiếc điện thoại - màn hình đã tắt từ lâu nhưng cô vẫn chờ đợi một tin nhắn mà trong thâm tâm biết rằng sẽ không bao giờ đến. Ba năm. Ba năm cô đã tin tưởng, đã yêu, đã hi sinh. Và bây giờ, tất cả chỉ còn là ánh trăng dối lừa phản chiếu trên mặt nước...',
  6, 3, 1050, DATEADD(day, -50, GETDATE())
),
(
  N'Kỹ thuật Pomodoro - Làm chủ thời gian trong thời đại số',
  N'Áp dụng phương pháp Pomodoro để tăng năng suất và giảm kiệt sức.',
  N'Kỹ thuật Pomodoro do Francesco Cirillo phát triển vào cuối những năm 1980, lấy cảm hứng từ chiếc đồng hồ hình quả cà chua (Pomodoro trong tiếng Ý). Phương pháp này chia công việc thành các khoảng thời gian tập trung 25 phút (gọi là một Pomodoro), xen kẽ với các kỳ nghỉ ngắn 5 phút. Sau 4 Pomodoro, bạn có một kỳ nghỉ dài 15-30 phút. Nghiên cứu khoa học chỉ ra rằng não bộ con người không thể duy trì sự tập trung tuyệt đối trong thời gian dài, và những khoảng nghỉ ngắn giúp phục hồi và tăng cường khả năng xử lý thông tin. Kết hợp Pomodoro với To-do list và GTD (Getting Things Done) sẽ mang lại hiệu quả tối đa.',
  7, 6, 400, DATEADD(day, -5, GETDATE())
);
GO

---------------------------------------------------------
-- 5. INSERT DOCTAGS (DocID 1-10, TagID 1-15)
---------------------------------------------------------
INSERT INTO DocTags (DocID, TagID) VALUES
(1,  2),  -- SQL Server -> CSDL
(2,  1),  -- Node.js -> Lập trình Web
(2,  12), -- Node.js -> Node.js
(3,  5),  -- Chứng khoán -> Đầu tư chứng khoán
(3,  15), -- Chứng khoán -> Kinh tế vĩ mô
(4,  3),  -- AI -> AI
(4,  8),  -- AI -> Machine Learning
(5,  6),  -- Bảo mật -> Bảo mật mạng
(6,  7),  -- Blockchain -> Blockchain
(6,  1),  -- Blockchain -> Lập trình Web
(7,  10), -- Luật -> Luật doanh nghiệp
(8,  4),  -- Marketing -> Marketing online
(8,  13), -- Marketing -> Tâm lý học
(9,  9),  -- Tiểu thuyết -> Tiểu thuyết
(10, 14); -- Pomodoro -> Giao tiếp hiệu quả
GO

---------------------------------------------------------
-- 6. INSERT INTERACTIONS
---------------------------------------------------------
INSERT INTO Interactions (UserID, DocID, InteractionType, CommentText, InteractionDate) VALUES
(2, 1, 'Like',    NULL,                                 DATEADD(day,-5,GETDATE())),
(3, 1, 'Like',    NULL,                                 DATEADD(day,-4,GETDATE())),
(4, 1, 'Comment', N'Bài viết cực kỳ chi tiết, cảm ơn tác giả!', DATEADD(day,-3,GETDATE())),
(5, 1, 'Comment', N'Mình đã học được rất nhiều từ bài này.',     DATEADD(day,-2,GETDATE())),
(2, 3, 'Like',    NULL,                                 DATEADD(day,-6,GETDATE())),
(3, 3, 'Like',    NULL,                                 DATEADD(day,-5,GETDATE())),
(4, 3, 'Like',    NULL,                                 DATEADD(day,-4,GETDATE())),
(5, 3, 'Like',    NULL,                                 DATEADD(day,-3,GETDATE())),
(6, 3, 'Comment', N'Phân tích rất sâu sắc và có giá trị thực tiễn!', DATEADD(day,-2,GETDATE())),
(1, 4, 'Like',    NULL,                                 DATEADD(day,-8,GETDATE())),
(2, 4, 'Comment', N'AI đang thay đổi thế giới thật sự!',         DATEADD(day,-7,GETDATE())),
(3, 4, 'Like',    NULL,                                 DATEADD(day,-5,GETDATE())),
(4, 4, 'Comment', N'Bài viết rất kịp thời và cần thiết.',        DATEADD(day,-3,GETDATE())),
(7, 9, 'Like',    NULL,                                 DATEADD(day,-10,GETDATE())),
(5, 9, 'Like',    NULL,                                 DATEADD(day,-8,GETDATE())),
(4, 9, 'Like',    NULL,                                 DATEADD(day,-5,GETDATE())),
(6, 9, 'Comment', N'Câu văn đẹp quá, mong tác giả ra chương 2 sớm!', DATEADD(day,-2,GETDATE()));
GO

---------------------------------------------------------
-- 7. INSERT SEARCH LOGS
---------------------------------------------------------
INSERT INTO SearchLogs (UserID, SearchQuery, SearchTime) VALUES
(2, N'SQL Server',        DATEADD(day,-2,GETDATE())),
(3, N'SQL Server',        DATEADD(day,-1,GETDATE())),
(4, N'chứng khoán',       DATEADD(day,-15,GETDATE())),
(5, N'chứng khoán',       DATEADD(day,-10,GETDATE())),
(6, N'chứng khoán',       DATEADD(day,-5,GETDATE())),
(7, N'chứng khoán',       GETDATE()),
(1, N'AI',                DATEADD(day,-2,GETDATE())),
(2, N'AI',                DATEADD(day,-1,GETDATE())),
(3, N'AI',                GETDATE()),
(4, N'AI',                GETDATE()),
(5, N'AI',                GETDATE()),
(6, N'Node.js api',       DATEADD(day,-20,GETDATE())),
(7, N'Luật doanh nghiệp', GETDATE()),
(1, N'lập trình web',     DATEADD(day,-3,GETDATE())),
(2, N'blockchain',        DATEADD(day,-1,GETDATE()));
GO
