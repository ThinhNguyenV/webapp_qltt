const router = require('express').Router();
const { getPool, sql } = require('../config/db');

// ── Demo definitions (B1=bài toán, B2=SQL text, beforeQ=B3, afterQ=B5) ──
const DEMOS = [
  // ══ STORED PROCEDURES ══════════════════════════════════════════════════
  {
    id: 'sp_search', category: 'Stored Procedure', icon: 'fas fa-search',
    b1: 'Xây dựng Stored Procedure tìm kiếm tài liệu theo từ khóa, ghi lịch sử tìm kiếm vào SearchLogs',
    b2: `EXEC sp_SearchDocument
    @Keyword    = N'SQL',   -- từ khóa tìm kiếm
    @CategoryID = NULL,     -- NULL = tất cả danh mục
    @UserID     = 1         -- ID người dùng (để ghi log)`,
    params: [
      { name: 'Keyword', type: 'nvarchar', required: true, placeholder: 'VD: SQL, AI, blockchain' },
      { name: 'CategoryID', type: 'int', required: false, placeholder: 'VD: 1 (bỏ trống = tất cả)' },
      { name: 'UserID', type: 'int', required: false, placeholder: 'VD: 1' },
    ],
    procName: 'sp_SearchDocument',
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> SearchLogs (5 log gần nhất)', sql: `SELECT TOP 5 sl.LogID, sl.SearchQuery, u.FullName AS SearchBy, sl.SearchTime FROM SearchLogs sl LEFT JOIN Users u ON sl.UserID=u.UserID ORDER BY sl.SearchTime DESC` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> SearchLogs (sau khi tìm kiếm)', sql: `SELECT TOP 5 sl.LogID, sl.SearchQuery, u.FullName AS SearchBy, sl.SearchTime FROM SearchLogs sl LEFT JOIN Users u ON sl.UserID=u.UserID ORDER BY sl.SearchTime DESC` },
    ],
    executeMode: 'proc',
  },
  {
    id: 'sp_getdoc', category: 'Stored Procedure', icon: 'fas fa-file-alt',
    b1: 'Xây dựng Stored Procedure lấy chi tiết tài liệu, tự động tăng ViewCount mỗi lần xem',
    b2: `EXEC sp_GetDocDetails @DocID = 1`,
    params: [
      { name: 'DocID', type: 'int', required: true, placeholder: 'VD: 1' },
    ],
    procName: 'sp_GetDocDetails',
    beforeQueries: [
      { label: '<i class="fas fa-chart-bar"></i> ViewCount trước khi xem', sql: `SELECT DocID, Title, ViewCount, LastModified FROM Documents WHERE DocID = 1` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-chart-bar"></i> ViewCount sau khi xem (đã tăng)', sql: `SELECT DocID, Title, ViewCount, LastModified FROM Documents WHERE DocID = 1` },
    ],
    executeMode: 'proc',
  },
  {
    id: 'sp_adddoc', category: 'Stored Procedure', icon: 'fas fa-plus',
    b1: 'Xây dựng Stored Procedure thêm tài liệu mới vào hệ thống, trả về DocID vừa tạo',
    b2: `EXEC sp_AddDocument
    @Title      = N'Tài liệu demo mới',
    @Summary    = N'Tóm tắt nội dung',
    @Content    = N'Nội dung chi tiết...',
    @CategoryID = 1,
    @AuthorID   = 1`,
    params: [
      { name: 'Title', type: 'nvarchar', required: true, placeholder: 'Tiêu đề tài liệu' },
      { name: 'Summary', type: 'nvarchar', required: false, placeholder: 'Tóm tắt (tùy chọn)' },
      { name: 'Content', type: 'nvarchar', required: true, placeholder: 'Nội dung tài liệu' },
      { name: 'CategoryID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'AuthorID', type: 'int', required: true, placeholder: 'VD: 1' },
    ],
    procName: 'sp_AddDocument',
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Số tài liệu hiện tại', sql: `SELECT COUNT(*) AS TongSoTaiLieu FROM Documents` },
      { label: '<i class="fas fa-table"></i> 3 tài liệu mới nhất', sql: `SELECT TOP 3 DocID, Title, AuthorID, CategoryID, PostDate FROM Documents ORDER BY DocID DESC` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> Số tài liệu sau khi thêm', sql: `SELECT COUNT(*) AS TongSoTaiLieu FROM Documents` },
      { label: '<i class="fas fa-table"></i> 3 tài liệu mới nhất (cập nhật)', sql: `SELECT TOP 3 DocID, Title, AuthorID, CategoryID, PostDate FROM Documents ORDER BY DocID DESC` },
    ],
    executeMode: 'proc',
  },
  {
    id: 'sp_updatestats', category: 'Stored Procedure', icon: 'fas fa-chart-line',
    b1: 'Xây dựng Stored Procedure cập nhật thủ công số lượt xem cho tài liệu',
    b2: `EXEC sp_UpdateDocumentStats
    @DocID    = 1,
    @AddViews = 10   -- thêm 10 lượt xem`,
    params: [
      { name: 'DocID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'AddViews', type: 'int', required: false, placeholder: 'VD: 10 (mặc định: 1)' },
    ],
    procName: 'sp_UpdateDocumentStats',
    beforeQueries: [
      { label: '<i class="fas fa-chart-bar"></i> ViewCount trước khi cập nhật', sql: `SELECT DocID, Title, ViewCount FROM Documents ORDER BY DocID` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-chart-bar"></i> ViewCount sau khi cập nhật', sql: `SELECT DocID, Title, ViewCount FROM Documents ORDER BY DocID` },
    ],
    executeMode: 'proc',
  },
  {
    id: 'sp_adduser', category: 'Stored Procedure', icon: 'fas fa-user-plus',
    b1: 'Xây dựng Stored Procedure thêm người dùng mới an toàn',
    b2: `EXEC sp_AddUser @Username='test2', @PasswordHash='hash', @FullName=N'Test', @Email='t2@mail.com', @Role='User'`,
    params: [
      { name: 'Username', type: 'nvarchar', required: true, placeholder: 'VD: test2' },
      { name: 'PasswordHash', type: 'nvarchar', required: true, placeholder: 'VD: hash' },
      { name: 'FullName', type: 'nvarchar', required: true, placeholder: 'VD: Test 2' },
      { name: 'Email', type: 'nvarchar', required: true, placeholder: 'VD: t2@mail.com' },
      { name: 'Role', type: 'nvarchar', required: false, placeholder: 'VD: User' },
    ],
    procName: 'sp_AddUser',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Users', sql: 'SELECT TOP 5 UserID, Username, Email FROM Users ORDER BY UserID DESC' }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Users sau khi thêm', sql: 'SELECT TOP 5 UserID, Username, Email FROM Users ORDER BY UserID DESC' }],
    executeMode: 'proc'
  },
  {
    id: 'sp_updpass', category: 'Stored Procedure', icon: 'fas fa-key',
    b1: 'Xây dựng Stored Procedure cập nhật mật khẩu người dùng',
    b2: `EXEC sp_UpdateUserPassword @UserID=1, @NewPasswordHash='newhash'`,
    params: [
      { name: 'UserID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'NewPasswordHash', type: 'nvarchar', required: true, placeholder: 'VD: newhash' }
    ],
    procName: 'sp_UpdateUserPassword',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Users (PasswordHash)', sql: 'SELECT UserID, Username, PasswordHash FROM Users WHERE UserID=1' }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Users (PasswordHash mới)', sql: 'SELECT UserID, Username, PasswordHash FROM Users WHERE UserID=1' }],
    executeMode: 'proc'
  },
  {
    id: 'sp_changestatus', category: 'Stored Procedure', icon: 'fas fa-exchange-alt',
    b1: 'Xây dựng Stored Procedure đổi trạng thái tài liệu (Published/Draft/Archived)',
    b2: `EXEC sp_ChangeDocumentStatus @DocID=1, @NewStatus='Draft'`,
    params: [
      { name: 'DocID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'NewStatus', type: 'nvarchar', required: true, placeholder: 'VD: Draft' }
    ],
    procName: 'sp_ChangeDocumentStatus',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Status hiện tại', sql: 'SELECT DocID, Title, Status FROM Documents WHERE DocID=1' }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Status sau khi đổi', sql: 'SELECT DocID, Title, Status FROM Documents WHERE DocID=1' }],
    executeMode: 'proc'
  },
  {
    id: 'sp_addcomment', category: 'Stored Procedure', icon: 'fas fa-comment',
    b1: 'Xây dựng Stored Procedure thêm bình luận',
    b2: `EXEC sp_AddComment @UserID=1, @DocID=1, @CommentText=N'Bài viết hay'`,
    params: [
      { name: 'UserID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'DocID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'CommentText', type: 'nvarchar', required: true, placeholder: 'VD: Bài viết hay' }
    ],
    procName: 'sp_AddComment',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Comments', sql: `SELECT TOP 5 InteractionID, UserID, DocID, CommentText FROM Interactions WHERE InteractionType='Comment' ORDER BY InteractionID DESC` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Comments mới', sql: `SELECT TOP 5 InteractionID, UserID, DocID, CommentText FROM Interactions WHERE InteractionType='Comment' ORDER BY InteractionID DESC` }],
    executeMode: 'proc'
  },
  {
    id: 'sp_delcomment', category: 'Stored Procedure', icon: 'fas fa-comment-slash',
    b1: 'Xây dựng Stored Procedure xóa bình luận (kiểm tra quyền)',
    b2: `EXEC sp_DeleteComment @InteractionID=1, @UserID=1`,
    params: [
      { name: 'InteractionID', type: 'int', required: true, placeholder: 'VD: 1' },
      { name: 'UserID', type: 'int', required: true, placeholder: 'VD: 1' }
    ],
    procName: 'sp_DeleteComment',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Comments', sql: `SELECT TOP 5 InteractionID, UserID, DocID, CommentText FROM Interactions WHERE InteractionType='Comment' ORDER BY InteractionID DESC` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Comments sau khi xóa', sql: `SELECT TOP 5 InteractionID, UserID, DocID, CommentText FROM Interactions WHERE InteractionType='Comment' ORDER BY InteractionID DESC` }],
    executeMode: 'proc'
  },
  {
    id: 'sp_getbytag', category: 'Stored Procedure', icon: 'fas fa-tags',
    b1: 'Xây dựng Stored Procedure lấy danh sách tài liệu theo Tag',
    b2: `EXEC sp_GetDocumentsByTag @TagName=N'AI'`,
    params: [
      { name: 'TagName', type: 'nvarchar', required: true, placeholder: 'VD: AI' }
    ],
    procName: 'sp_GetDocumentsByTag',
    beforeQueries: [],
    afterQueries: [],
    executeMode: 'proc'
  },
  // ══ TRIGGERS ═══════════════════════════════════════════════════════════
  {
    id: 'trg_logdelete', category: 'Trigger', icon: 'fas fa-trash-alt',
    b1: 'Xây dựng Trigger tự động ghi nhật ký vào DeletedDocumentsLog khi xóa tài liệu',
    b2: `-- Trigger định nghĩa (AFTER DELETE trên bảng Documents):
CREATE OR ALTER TRIGGER trg_LogDeletedDocument
ON Documents AFTER DELETE AS
BEGIN
    INSERT INTO DeletedDocumentsLog (DocID, Title, DeletedBy, DeletedAt)
    SELECT DocID, Title, 'SYSTEM', GETDATE() FROM deleted;
END;

-- Demo: Thêm tài liệu test rồi xóa để kích hoạt trigger
INSERT INTO Documents (Title, Summary, Content, CategoryID, AuthorID)
VALUES (N'[TEST] Tài liệu demo xóa', N'Test', N'Test', 1, 1);
DELETE FROM Documents WHERE Title = N'[TEST] Tài liệu demo xóa';`,
    params: [],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> DeletedDocumentsLog (trước)', sql: `SELECT TOP 5 * FROM DeletedDocumentsLog ORDER BY DeletedAt DESC` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> DeletedDocumentsLog (sau — trigger đã ghi log)', sql: `SELECT TOP 5 * FROM DeletedDocumentsLog ORDER BY DeletedAt DESC` },
    ],
    executeMode: 'raw',
    executeSql: `
      INSERT INTO Documents (Title, Summary, Content, CategoryID, AuthorID, Status)
      VALUES (N'[TEST] Tài liệu demo xóa', N'Test trigger', N'Test content', 1, 1, 'Published');
      DELETE FROM Documents WHERE Title = N'[TEST] Tài liệu demo xóa';
    `,
  },
  {
    id: 'trg_preventcatdel', category: 'Trigger', icon: 'fas fa-shield-alt',
    b1: 'Xây dựng Trigger ngăn chặn xóa danh mục khi còn tài liệu thuộc danh mục đó (INSTEAD OF DELETE)',
    b2: `-- Trigger định nghĩa (INSTEAD OF DELETE trên bảng Categories):
CREATE OR ALTER TRIGGER trg_PreventCategoryDelete
ON Categories INSTEAD OF DELETE AS
BEGIN
    IF EXISTS (SELECT 1 FROM Documents d JOIN deleted c ON d.CategoryID = c.CatID)
    BEGIN
        RAISERROR('Cannot delete category because it contains documents.', 16, 1);
        ROLLBACK TRANSACTION;
    END
    ELSE DELETE FROM Categories WHERE CatID IN (SELECT CatID FROM deleted);
END;

-- Demo: Thử xóa danh mục CatID=1 (có tài liệu) → trigger sẽ ngăn
DELETE FROM Categories WHERE CatID = 1;`,
    params: [],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Danh mục và số tài liệu', sql: `SELECT c.CatID, c.CatName, COUNT(d.DocID) AS SoTaiLieu FROM Categories c LEFT JOIN Documents d ON c.CatID=d.CategoryID GROUP BY c.CatID, c.CatName ORDER BY c.CatID` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> Kết quả sau thao tác', sql: `SELECT c.CatID, c.CatName, COUNT(d.DocID) AS SoTaiLieu FROM Categories c LEFT JOIN Documents d ON c.CatID=d.CategoryID GROUP BY c.CatID, c.CatName ORDER BY c.CatID` },
    ],
    executeMode: 'raw_expect_error',
    executeSql: `DELETE FROM Categories WHERE CatID = 1;`,
    expectedError: 'Trigger hoạt động đúng: Ngăn chặn xóa danh mục vì còn tài liệu',
  },
  {
    id: 'trg_lastmodified', category: 'Trigger', icon: 'fas fa-clock',
    b1: 'Xây dựng Trigger tự động cập nhật cột LastModified khi tài liệu được chỉnh sửa',
    b2: `-- Trigger định nghĩa (AFTER UPDATE trên bảng Documents):
CREATE OR ALTER TRIGGER trg_UpdateLastModified
ON Documents AFTER UPDATE AS
BEGIN
    IF NOT UPDATE(LastModified)
        UPDATE Documents SET LastModified = GETDATE()
        FROM Documents d JOIN inserted i ON d.DocID = i.DocID;
END;

-- Demo: Cập nhật ViewCount của DocID=2 → LastModified tự thay đổi
UPDATE Documents SET ViewCount = ViewCount + 1 WHERE DocID = 2;`,
    params: [],
    beforeQueries: [
      { label: '<i class="fas fa-chart-bar"></i> LastModified trước khi update', sql: `SELECT DocID, Title, ViewCount, LastModified FROM Documents WHERE DocID = 2` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-chart-bar"></i> LastModified sau khi update (trigger tự cập nhật)', sql: `SELECT DocID, Title, ViewCount, LastModified FROM Documents WHERE DocID = 2` },
    ],
    executeMode: 'raw',
    executeSql: `UPDATE Documents SET ViewCount = ViewCount + 1 WHERE DocID = 2;`,
  },
  {
    id: 'trg_email', category: 'Trigger', icon: 'fas fa-envelope',
    b1: 'Xây dựng Trigger kiểm tra định dạng email hợp lệ khi thêm hoặc cập nhật người dùng',
    b2: `-- Trigger định nghĩa (AFTER INSERT, UPDATE trên bảng Users):
CREATE OR ALTER TRIGGER trg_CheckValidEmail
ON Users AFTER INSERT, UPDATE AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted WHERE Email NOT LIKE '%_@__%.__%')
    BEGIN
        RAISERROR('Invalid email format.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;

-- Demo: Thử insert user với email sai định dạng
INSERT INTO Users (Username, PasswordHash, FullName, Email)
VALUES ('testuser', '123', N'Test User', 'email-sai-dinh-dang');`,
    params: [],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Users hiện tại', sql: `SELECT UserID, Username, FullName, Email FROM Users ORDER BY UserID` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> Users sau thao tác (không thay đổi — trigger đã rollback)', sql: `SELECT UserID, Username, FullName, Email FROM Users ORDER BY UserID` },
    ],
    executeMode: 'raw_expect_error',
    executeSql: `INSERT INTO Users (Username, PasswordHash, FullName, Email) VALUES ('testuser_bad', '123', N'Test User', 'email-sai-dinh-dang');`,
    expectedError: 'Trigger hoạt động đúng: Từ chối email sai định dạng',
  },
  {
    id: 'trg_dupcat', category: 'Trigger', icon: 'fas fa-sync-alt',
    b1: 'Xây dựng Trigger ngăn chặn tên danh mục bị trùng lặp (không phân biệt hoa/thường, bỏ khoảng trắng)',
    b2: `-- Trigger định nghĩa (AFTER INSERT, UPDATE trên bảng Categories):
CREATE OR ALTER TRIGGER trg_PreventDuplicateCategory
ON Categories AFTER INSERT, UPDATE AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM Categories c JOIN inserted i
        ON LTRIM(RTRIM(LOWER(c.CatName))) = LTRIM(RTRIM(LOWER(i.CatName)))
        WHERE c.CatID <> i.CatID
    ) BEGIN
        RAISERROR('Category name already exists.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;

-- Demo: Thử thêm danh mục trùng tên (khác cách viết hoa/thường)
INSERT INTO Categories (CatName) VALUES (N'CÔNG NGHỆ THÔNG TIN');`,
    params: [],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Danh sách danh mục', sql: `SELECT CatID, CatName FROM Categories ORDER BY CatID` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> Danh sách danh mục (không thay đổi — trigger đã rollback)', sql: `SELECT CatID, CatName FROM Categories ORDER BY CatID` },
    ],
    executeMode: 'raw_expect_error',
    executeSql: `INSERT INTO Categories (CatName) VALUES (N'CÔNG NGHỆ THÔNG TIN');`,
    expectedError: 'Trigger hoạt động đúng: Ngăn chặn tên danh mục trùng lặp',
  },
  {
    id: 'trg_nodraftint', category: 'Trigger', icon: 'fas fa-ban',
    b1: 'Xây dựng Trigger ngăn chặn tương tác (Like/Comment) nếu tài liệu đang Draft',
    b2: `INSERT INTO Interactions (UserID, DocID, InteractionType) VALUES (1, 999, 'Like');`,
    params: [],
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Status của tài liệu 1', sql: `SELECT DocID, Title, Status FROM Documents WHERE DocID = 1` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Tài liệu 1 được đổi lại thành Published để không hỏng dữ liệu khác', sql: `SELECT DocID, Title, Status FROM Documents WHERE DocID = 1` }],
    executeMode: 'raw_expect_error',
    executeSql: `
      UPDATE Documents SET Status = 'Draft' WHERE DocID = 1;
      INSERT INTO Interactions (UserID, DocID, InteractionType) VALUES (1, 1, 'Like');
    `,
    expectedError: 'Trigger hoạt động: Cannot like or comment on a draft document'
  },
  {
    id: 'trg_commlen', category: 'Trigger', icon: 'fas fa-text-height',
    b1: 'Xây dựng Trigger kiểm tra độ dài bình luận tối thiểu',
    b2: `INSERT INTO Interactions (UserID, DocID, InteractionType, CommentText) VALUES (1, 1, 'Comment', '   ');`,
    params: [],
    beforeQueries: [],
    afterQueries: [],
    executeMode: 'raw_expect_error',
    executeSql: `INSERT INTO Interactions (UserID, DocID, InteractionType, CommentText) VALUES (1, 1, 'Comment', '   ');`,
    expectedError: 'Trigger hoạt động: Comment text cannot be empty'
  },
  {
    id: 'trg_softdel', category: 'Trigger', icon: 'fas fa-user-times',
    b1: 'Xây dựng Trigger chuyển trạng thái User thành Inactive thay vì xóa (Soft Delete)',
    b2: `DELETE FROM Users WHERE UserID = 2;`,
    params: [],
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Status của User 2', sql: `SELECT UserID, Username, Status FROM Users WHERE UserID = 2` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Status của User 2 sau khi DELETE', sql: `SELECT UserID, Username, Status FROM Users WHERE UserID = 2` }],
    executeMode: 'raw',
    executeSql: `DELETE FROM Users WHERE UserID = 2;`
  },
  {
    id: 'trg_rolechange', category: 'Trigger', icon: 'fas fa-user-tag',
    b1: 'Xây dựng Trigger ghi log khi đổi Role của người dùng',
    b2: `UPDATE Users SET Role = 'Admin' WHERE UserID = 3;`,
    params: [],
    beforeQueries: [{ label: '<i class="fas fa-table"></i> SystemLogs (trước)', sql: `SELECT TOP 3 * FROM SystemLogs ORDER BY LogDate DESC` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> SystemLogs (sau)', sql: `SELECT TOP 3 * FROM SystemLogs ORDER BY LogDate DESC` }],
    executeMode: 'raw',
    executeSql: `UPDATE Users SET Role = 'Admin' WHERE UserID = 3;`
  },
  {
    id: 'trg_duptag', category: 'Trigger', icon: 'fas fa-tags',
    b1: 'Xây dựng Trigger ngăn chặn tạo Tag trùng lặp',
    b2: `INSERT INTO Tags (TagName) VALUES (N'AI');`,
    params: [],
    beforeQueries: [],
    afterQueries: [],
    executeMode: 'raw_expect_error',
    executeSql: `INSERT INTO Tags (TagName) VALUES (N'AI');`,
    expectedError: 'Trigger hoạt động: Duplicate TagName detected'
  },
  // ══ FUNCTIONS ══════════════════════════════════════════════════════════
  {
    id: 'fn_tags', category: 'Function', icon: 'fas fa-tags',
    b1: 'Xây dựng Scalar Function lấy danh sách thẻ tag của tài liệu dưới dạng chuỗi',
    b2: `SELECT dbo.fn_GetDocTags(@DocID) AS DanhSachTags`,
    params: [
      { name: 'DocID', type: 'int', required: true, placeholder: 'VD: 2' },
    ],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Tags của các tài liệu (bảng DocTags + Tags)', sql: `SELECT d.DocID, d.Title, t.TagName FROM Documents d JOIN DocTags dt ON d.DocID=dt.DocID JOIN Tags t ON dt.TagID=t.TagID ORDER BY d.DocID` },
    ],
    afterQueries: [],
    executeMode: 'raw',
    executeSql: `SELECT dbo.fn_GetDocTags(@DocID) AS DanhSachTags`,
    executeParams: [{ name: 'DocID', type: 'int' }],
  },
  {
    id: 'fn_likes', category: 'Function', icon: 'fas fa-heart',
    b1: 'Xây dựng Scalar Function đếm số lượt thích (Like) của một tài liệu',
    b2: `SELECT dbo.fn_CountLikes(@DocID) AS SoLuotThich`,
    params: [
      { name: 'DocID', type: 'int', required: true, placeholder: 'VD: 3' },
    ],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Bảng Interactions (Like)', sql: `SELECT DocID, COUNT(*) AS SoLike FROM Interactions WHERE InteractionType='Like' GROUP BY DocID ORDER BY DocID` },
    ],
    afterQueries: [],
    executeMode: 'raw',
    executeSql: `SELECT dbo.fn_CountLikes(@DocID) AS SoLuotThich`,
    executeParams: [{ name: 'DocID', type: 'int' }],
  },
  {
    id: 'fn_countcat', category: 'Function', icon: 'fas fa-folder-open',
    b1: 'Xây dựng Scalar Function đếm số lượng tài liệu thuộc một danh mục',
    b2: `SELECT dbo.fn_CountDocsByCategory(@CatID) AS SoTaiLieu`,
    params: [
      { name: 'CatID', type: 'int', required: true, placeholder: 'VD: 1' },
    ],
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> Số tài liệu theo danh mục', sql: `SELECT c.CatID, c.CatName, COUNT(d.DocID) AS SoTaiLieu FROM Categories c LEFT JOIN Documents d ON c.CatID=d.CategoryID GROUP BY c.CatID, c.CatName ORDER BY c.CatID` },
    ],
    afterQueries: [],
    executeMode: 'raw',
    executeSql: `SELECT dbo.fn_CountDocsByCategory(@CatID) AS SoTaiLieu`,
    executeParams: [{ name: 'CatID', type: 'int' }],
  },
  {
    id: 'fn_comments', category: 'Function', icon: 'fas fa-comments',
    b1: 'Xây dựng Scalar Function đếm số bình luận của tài liệu',
    b2: `SELECT dbo.fn_CountComments(@DocID) AS SoBinhLuan`,
    params: [{ name: 'DocID', type: 'int', required: true, placeholder: 'VD: 1' }],
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Interactions (Comment)', sql: `SELECT DocID, COUNT(*) AS SoComment FROM Interactions WHERE InteractionType='Comment' GROUP BY DocID` }],
    afterQueries: [],
    executeMode: 'raw',
    executeSql: `SELECT dbo.fn_CountComments(@DocID) AS SoBinhLuan`,
    executeParams: [{ name: 'DocID', type: 'int' }],
  },
  {
    id: 'fn_userrole', category: 'Function', icon: 'fas fa-user-shield',
    b1: 'Xây dựng Scalar Function lấy vai trò của người dùng',
    b2: `SELECT dbo.fn_GetUserRole(@UserID) AS VaiTro`,
    params: [{ name: 'UserID', type: 'int', required: true, placeholder: 'VD: 1' }],
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Users', sql: `SELECT UserID, Username, Role FROM Users ORDER BY UserID` }],
    afterQueries: [],
    executeMode: 'raw',
    executeSql: `SELECT dbo.fn_GetUserRole(@UserID) AS VaiTro`,
    executeParams: [{ name: 'UserID', type: 'int' }],
  },
  {
    id: 'fn_totalviews', category: 'Function', icon: 'fas fa-eye',
    b1: 'Xây dựng Scalar Function tổng số lượt xem các bài viết của một tác giả',
    b2: `SELECT dbo.fn_GetTotalViewsByAuthor(@AuthorID) AS TongView`,
    params: [{ name: 'AuthorID', type: 'int', required: true, placeholder: 'VD: 1' }],
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Documents', sql: `SELECT AuthorID, SUM(ViewCount) AS TotalViews FROM Documents GROUP BY AuthorID` }],
    afterQueries: [],
    executeMode: 'raw',
    executeSql: `SELECT dbo.fn_GetTotalViewsByAuthor(@AuthorID) AS TongView`,
    executeParams: [{ name: 'AuthorID', type: 'int' }],
  },
  // ══ CURSORS ════════════════════════════════════════════════════════════
  {
    id: 'cur_weekly', category: 'Cursor', icon: 'fas fa-envelope-open-text',
    b1: 'Xây dựng Cursor duyệt danh sách tài liệu trong 7 ngày qua để tổng hợp nội dung Weekly Email Digest',
    b2: `EXEC sp_Cursor_SendWeeklyEmail
-- Cursor duyệt từng tài liệu mới trong 7 ngày
-- Ghép thành chuỗi Digest rồi INSERT vào SystemLogs`,
    params: [],
    procName: 'sp_Cursor_SendWeeklyEmail',
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> SystemLogs (trước khi chạy cursor)', sql: `SELECT TOP 5 LogID, LEFT(LogMessage,80) AS LogMessage, LogDate FROM SystemLogs ORDER BY LogDate DESC` },
      { label: '<i class="fas fa-table"></i> Tài liệu trong 7 ngày qua', sql: `SELECT DocID, Title, PostDate FROM Documents WHERE PostDate >= DATEADD(day,-7,GETDATE()) ORDER BY PostDate DESC` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> SystemLogs (cursor đã ghi digest)', sql: `SELECT TOP 5 LogID, LEFT(LogMessage,100) AS LogMessage, LogDate FROM SystemLogs ORDER BY LogDate DESC` },
    ],
    executeMode: 'proc',
  },
  {
    id: 'cur_stats', category: 'Cursor', icon: 'fas fa-sync',
    b1: 'Xây dựng Cursor duyệt toàn bộ tài liệu, tính lại số lượt thích và ghi kết quả audit vào SystemLogs',
    b2: `EXEC sp_Cursor_RecalculateStats
-- Cursor duyệt từng DocID trong bảng Documents
-- Gọi fn_CountLikes() cho mỗi tài liệu
-- Ghi kết quả vào SystemLogs`,
    params: [],
    procName: 'sp_Cursor_RecalculateStats',
    beforeQueries: [
      { label: '<i class="fas fa-table"></i> SystemLogs (trước khi audit)', sql: `SELECT TOP 5 LogID, LEFT(LogMessage,80) AS LogMessage, LogDate FROM SystemLogs ORDER BY LogDate DESC` },
    ],
    afterQueries: [
      { label: '<i class="fas fa-table"></i> SystemLogs (cursor đã ghi audit từng tài liệu)', sql: `SELECT TOP 10 LogID, LogMessage, LogDate FROM SystemLogs ORDER BY LogDate DESC` },
    ],
    executeMode: 'proc',
  },
  {
    id: 'cur_archive', category: 'Cursor', icon: 'fas fa-archive',
    b1: 'Xây dựng Cursor tự động lưu trữ (Archive) các tài liệu cũ',
    b2: `EXEC sp_Cursor_ArchiveOldDocuments`,
    params: [],
    procName: 'sp_Cursor_ArchiveOldDocuments',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Documents cũ', sql: `SELECT DocID, Title, PostDate, Status FROM Documents WHERE PostDate < DATEADD(year, -2, GETDATE())` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Documents cũ (sau khi Archive)', sql: `SELECT DocID, Title, PostDate, Status FROM Documents WHERE PostDate < DATEADD(year, -2, GETDATE())` }],
    executeMode: 'proc',
  },
  {
    id: 'cur_cleantags', category: 'Cursor', icon: 'fas fa-broom',
    b1: 'Xây dựng Cursor dọn dẹp các Tags không được sử dụng',
    b2: `EXEC sp_Cursor_CleanUpUnusedTags`,
    params: [],
    procName: 'sp_Cursor_CleanUpUnusedTags',
    beforeQueries: [{ label: '<i class="fas fa-table"></i> Tags không được dùng', sql: `SELECT t.TagID, t.TagName FROM Tags t LEFT JOIN DocTags dt ON t.TagID = dt.TagID WHERE dt.DocID IS NULL` }],
    afterQueries: [{ label: '<i class="fas fa-table"></i> Tags không được dùng (sau khi dọn)', sql: `SELECT t.TagID, t.TagName FROM Tags t LEFT JOIN DocTags dt ON t.TagID = dt.TagID WHERE dt.DocID IS NULL` }],
    executeMode: 'proc',
  },
];

// ── GET /api/demos — trả về danh sách demo (không có SQL nhạy cảm)
router.get('/demos', (req, res) => {
  const list = DEMOS.map(d => ({
    id: d.id, category: d.category, icon: d.icon,
    b1: d.b1, b2: d.b2, params: d.params || [],
    hasAfter: (d.afterQueries || []).length > 0,
    expectedError: d.expectedError,
  }));
  res.json(list);
});

// ── GET /api/demos/:id/before — tải dữ liệu B3
router.get('/demos/:id/before', async (req, res) => {
  const demo = DEMOS.find(d => d.id === req.params.id);
  if (!demo) return res.status(404).json({ error: 'Demo not found' });
  try {
    const pool = getPool();
    const results = [];
    for (const q of (demo.beforeQueries || [])) {
      const r = await pool.request().query(q.sql);
      results.push({ label: q.label, columns: r.recordset.length ? Object.keys(r.recordset[0]) : [], rows: r.recordset });
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/demos/:id/execute — thực thi B4
router.post('/demos/:id/execute', async (req, res) => {
  const demo = DEMOS.find(d => d.id === req.params.id);
  if (!demo) return res.status(404).json({ error: 'Demo not found' });
  const params = req.body.params || {};
  const pool = getPool();
  const t0 = Date.now();
  try {
    let recordsets = [];
    if (demo.executeMode === 'proc') {
      const req2 = pool.request();
      for (const p of (demo.params || [])) {
        const v = params[p.name];
        if (p.required && (v == null || v === '')) return res.status(400).json({ error: `Thiếu tham số: ${p.name}` });
        if (v != null && v !== '') {
          req2.input(p.name, p.type === 'int' ? sql.Int : sql.NVarChar(sql.MAX), p.type === 'int' ? parseInt(v) : String(v));
        }
      }
      const r = await req2.execute(demo.procName);
      recordsets = r.recordsets.map(rs => ({ columns: rs.length ? Object.keys(rs[0]) : [], rows: rs }));
    } else if (demo.executeMode === 'raw' || demo.executeMode === 'raw_expect_error') {
      let q = demo.executeSql;
      const req2 = pool.request();
      for (const p of (demo.executeParams || [])) {
        const v = params[p.name];
        if (v != null && v !== '') {
          req2.input(p.name, p.type === 'int' ? sql.Int : sql.NVarChar(sql.MAX), p.type === 'int' ? parseInt(v) : String(v));
        }
      }
      const r = await req2.query(q);
      recordsets = r.recordset ? [{ columns: r.recordset.length ? Object.keys(r.recordset[0]) : [], rows: r.recordset }] : [];
    }

    // Phát sự kiện qua socket.io
    if (req.app.get('io')) {
      req.app.get('io').emit('data_updated', { source: 'sqllab' });
    }

    res.json({ success: true, elapsed: Date.now() - t0, recordsets });
  } catch (err) {
    if (demo.executeMode === 'raw_expect_error') {
      return res.json({ success: true, elapsed: Date.now() - t0, isExpectedError: true, message: demo.expectedError, errorDetail: err.message, recordsets: [] });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/demos/:id/after — tải dữ liệu B5
router.get('/demos/:id/after', async (req, res) => {
  const demo = DEMOS.find(d => d.id === req.params.id);
  if (!demo) return res.status(404).json({ error: 'Demo not found' });
  try {
    const pool = getPool();
    const results = [];
    for (const q of (demo.afterQueries || [])) {
      const r = await pool.request().query(q.sql);
      results.push({ label: q.label, columns: r.recordset.length ? Object.keys(r.recordset[0]) : [], rows: r.recordset });
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/reports — load report data từ DB (Section B)
router.get('/reports', async (req, res) => {
  const pool = getPool();
  try {
    const [r1, r2, r3, r4, r5, r6, r7, r8] = await Promise.all([
      pool.request().execute('sp_Report_TopDocuments'),
      pool.request().input('Year', sql.Int, new Date().getFullYear()).execute('sp_Report_MonthlyPosts'),
      pool.request().execute('sp_Report_ActiveUsers'),
      pool.request().execute('sp_Report_StorageByCategory'),
      pool.request().input('Days', sql.Int, 30).execute('sp_Report_TrendingKeywords'),
      pool.request().execute('sp_Report_DocumentStatus'),
      pool.request().execute('sp_Report_InteractionsSummary'),
      pool.request().execute('sp_Report_TopTags'),
    ]);
    res.json({
      topDocuments: r1.recordset,
      monthlyPosts: r2.recordset,
      activeUsers: r3.recordset,
      storageByCategory: r4.recordset,
      trendingKeywords: r5.recordset,
      documentStatus: r6.recordset,
      interactionsSummary: r7.recordset,
      topTags: r8.recordset,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
