USE DocumentDB;
GO

---------------------------------------------------------
-- A. FUNCTIONS (6)
---------------------------------------------------------

-- F1: Lấy danh sách các thẻ (tags) của một tài liệu dưới dạng chuỗi
CREATE OR ALTER FUNCTION fn_GetDocTags (@DocID INT)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @Tags NVARCHAR(MAX) = '';
    SELECT @Tags = @Tags + t.TagName + ', '
    FROM DocTags dt
    JOIN Tags t ON dt.TagID = t.TagID
    WHERE dt.DocID = @DocID;
    
    IF LEN(@Tags) > 0
        SET @Tags = LEFT(@Tags, LEN(@Tags) - 1);
        
    RETURN @Tags;
END;
GO

-- F2: Đếm số lượt thích của tài liệu
CREATE OR ALTER FUNCTION fn_CountLikes (@DocID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;
    SELECT @Count = COUNT(*) FROM Interactions WHERE DocID = @DocID AND InteractionType = 'Like';
    RETURN @Count;
END;
GO

-- F3: Hàm đếm số lượng tài liệu theo danh mục
CREATE OR ALTER FUNCTION fn_CountDocsByCategory (@CatID INT)
RETURNS INT
AS
BEGIN
    DECLARE @DocCount INT;
    SELECT @DocCount = COUNT(*) FROM Documents WHERE CategoryID = @CatID;
    RETURN @DocCount;
END;
GO

-- F4: Đếm số bình luận của tài liệu
CREATE OR ALTER FUNCTION fn_CountComments (@DocID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;
    SELECT @Count = COUNT(*) FROM Interactions WHERE DocID = @DocID AND InteractionType = 'Comment';
    RETURN @Count;
END;
GO

-- F5: Lấy vai trò của người dùng
CREATE OR ALTER FUNCTION fn_GetUserRole (@UserID INT)
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @Role NVARCHAR(20);
    SELECT @Role = Role FROM Users WHERE UserID = @UserID;
    RETURN @Role;
END;
GO

-- F6: Tổng số lượt xem các bài viết của một tác giả
CREATE OR ALTER FUNCTION fn_GetTotalViewsByAuthor (@AuthorID INT)
RETURNS INT
AS
BEGIN
    DECLARE @TotalViews INT;
    SELECT @TotalViews = SUM(ViewCount) FROM Documents WHERE AuthorID = @AuthorID;
    RETURN ISNULL(@TotalViews, 0);
END;
GO


---------------------------------------------------------
-- B. STORED PROCEDURES (10 chính)
---------------------------------------------------------

-- SP1: Tìm kiếm tài liệu và ghi log (theo tên được yêu cầu)
CREATE OR ALTER PROCEDURE sp_SearchDocument
    @Keyword NVARCHAR(255),
    @CategoryID INT = NULL,
    @UserID INT = NULL
AS
BEGIN
    -- Ghi nhận log tìm kiếm
    IF @Keyword IS NOT NULL AND LTRIM(RTRIM(@Keyword)) <> ''
    BEGIN
        INSERT INTO SearchLogs (UserID, SearchQuery) VALUES (@UserID, @Keyword);
    END
    
    -- Trả kết quả tìm kiếm
    SELECT 
        d.DocID, d.Title, d.Summary, d.PostDate, d.ViewCount,
        u.FullName AS AuthorName,
        c.CatName,
        dbo.fn_GetDocTags(d.DocID) AS Tags,
        dbo.fn_CountLikes(d.DocID) AS LikeCount
    FROM Documents d
    JOIN Users u ON d.AuthorID = u.UserID
    JOIN Categories c ON d.CategoryID = c.CatID
    WHERE d.Status = 'Published'
      AND (@CategoryID IS NULL OR d.CategoryID = @CategoryID)
      AND (
          @Keyword IS NULL OR @Keyword = ''
          OR d.Title LIKE '%' + @Keyword + '%'
          OR d.Summary LIKE '%' + @Keyword + '%'
          OR c.CatName LIKE '%' + @Keyword + '%'
      )
    ORDER BY d.PostDate DESC;
END;
GO

-- SP2: Thêm người dùng mới an toàn
CREATE OR ALTER PROCEDURE sp_AddUser
    @Username NVARCHAR(50),
    @PasswordHash NVARCHAR(255),
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100),
    @Role NVARCHAR(20) = 'User'
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE Username = @Username OR Email = @Email)
    BEGIN
        RAISERROR('Username or Email already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
    VALUES (@Username, @PasswordHash, @FullName, @Email, @Role);
END;
GO

-- SP3: Cập nhật thủ công thống kê (ví dụ viewcount) cho tài liệu
CREATE OR ALTER PROCEDURE sp_UpdateDocumentStats
    @DocID INT,
    @AddViews INT = 1
AS
BEGIN
    UPDATE Documents
    SET ViewCount = ViewCount + @AddViews,
        LastModified = GETDATE()
    WHERE DocID = @DocID;
END;
GO

-- SP4: Thêm tài liệu mới
CREATE OR ALTER PROCEDURE sp_AddDocument
    @Title NVARCHAR(255),
    @Summary NVARCHAR(500),
    @Content NVARCHAR(MAX),
    @CategoryID INT,
    @AuthorID INT
AS
BEGIN
    INSERT INTO Documents (Title, Summary, Content, CategoryID, AuthorID)
    VALUES (@Title, @Summary, @Content, @CategoryID, @AuthorID);
    
    SELECT SCOPE_IDENTITY() AS NewDocID;
END;
GO

-- SP5: Xem chi tiết tài liệu (Tăng ViewCount)
CREATE OR ALTER PROCEDURE sp_GetDocDetails
    @DocID INT
AS
BEGIN
    -- Tăng view count
    UPDATE Documents SET ViewCount = ViewCount + 1 WHERE DocID = @DocID;
    
    -- Chi tiết
    SELECT 
        d.*,
        u.FullName AS AuthorName,
        c.CatName,
        dbo.fn_GetDocTags(d.DocID) AS Tags,
        dbo.fn_CountLikes(d.DocID) AS LikeCount
    FROM Documents d
    JOIN Users u ON d.AuthorID = u.UserID
    JOIN Categories c ON d.CategoryID = c.CatID
    WHERE d.DocID = @DocID;
    
    -- Bình luận
    SELECT 
        i.InteractionID, i.CommentText, i.InteractionDate, u.FullName
    FROM Interactions i
    JOIN Users u ON i.UserID = u.UserID
    WHERE i.DocID = @DocID AND i.InteractionType = 'Comment'
    ORDER BY i.InteractionDate DESC;
END;
GO

-- SP6: Cập nhật mật khẩu người dùng
CREATE OR ALTER PROCEDURE sp_UpdateUserPassword
    @UserID INT,
    @NewPasswordHash NVARCHAR(255)
AS
BEGIN
    UPDATE Users SET PasswordHash = @NewPasswordHash WHERE UserID = @UserID;
END;
GO

-- SP7: Đổi trạng thái tài liệu (Published/Draft/Archived)
CREATE OR ALTER PROCEDURE sp_ChangeDocumentStatus
    @DocID INT,
    @NewStatus NVARCHAR(20)
AS
BEGIN
    UPDATE Documents SET Status = @NewStatus, LastModified = GETDATE() WHERE DocID = @DocID;
END;
GO

-- SP8: Thêm bình luận
CREATE OR ALTER PROCEDURE sp_AddComment
    @UserID INT,
    @DocID INT,
    @CommentText NVARCHAR(500)
AS
BEGIN
    INSERT INTO Interactions (UserID, DocID, InteractionType, CommentText)
    VALUES (@UserID, @DocID, 'Comment', @CommentText);
END;
GO

-- SP9: Xóa bình luận
CREATE OR ALTER PROCEDURE sp_DeleteComment
    @InteractionID INT,
    @UserID INT -- Dùng để kiểm tra quyền tác giả của bình luận
AS
BEGIN
    DELETE FROM Interactions 
    WHERE InteractionID = @InteractionID AND UserID = @UserID AND InteractionType = 'Comment';
END;
GO

-- SP10: Lấy danh sách tài liệu theo Tag
CREATE OR ALTER PROCEDURE sp_GetDocumentsByTag
    @TagName NVARCHAR(50)
AS
BEGIN
    SELECT d.DocID, d.Title, d.Summary, d.PostDate, d.ViewCount, u.FullName AS AuthorName
    FROM Documents d
    JOIN Users u ON d.AuthorID = u.UserID
    JOIN DocTags dt ON d.DocID = dt.DocID
    JOIN Tags t ON dt.TagID = t.TagID
    WHERE t.TagName = @TagName AND d.Status = 'Published'
    ORDER BY d.PostDate DESC;
END;
GO

---------------------------------------------------------
-- C. TRIGGERS (10)
---------------------------------------------------------

-- TR1: Tự động lưu nhật ký khi xóa tài liệu
CREATE OR ALTER TRIGGER trg_LogDeletedDocument
ON Documents
AFTER DELETE
AS
BEGIN
    INSERT INTO DeletedDocumentsLog (DocID, Title, DeletedBy, DeletedAt)
    SELECT DocID, Title, 'SYSTEM', GETDATE()
    FROM deleted;
END;
GO

-- TR2: Tự động xóa dữ liệu liên kết trước khi xóa tài liệu (thay cho CASCADE nếu muốn quản lý phức tạp hơn)
-- Lưu ý: Vì ta đã cấu hình ON DELETE CASCADE ở bảng DocTags và Interactions, ta không dùng INSTEAD OF DELETE nữa,
-- mà dùng AFTER DELETE cho TR1. Nếu dùng INSTEAD OF thì TR1 sẽ không chạy đúng cách.
-- Thay vào đó, tạo Trigger ngăn chặn xóa Category nếu đang có Document:
CREATE OR ALTER TRIGGER trg_PreventCategoryDelete
ON Categories
INSTEAD OF DELETE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM Documents d JOIN deleted c ON d.CategoryID = c.CatID)
    BEGIN
        RAISERROR('Cannot delete category because it contains documents.', 16, 1);
        ROLLBACK TRANSACTION;
    END
    ELSE
    BEGIN
        DELETE FROM Categories WHERE CatID IN (SELECT CatID FROM deleted);
    END
END;
GO

-- TR3: Cập nhật thời gian chỉnh sửa cuối cùng
CREATE OR ALTER TRIGGER trg_UpdateLastModified
ON Documents
AFTER UPDATE
AS
BEGIN
    -- Chỉ cập nhật nếu không phải do Trigger này gọi lại (tránh loop)
    IF NOT UPDATE(LastModified)
    BEGIN
        UPDATE Documents
        SET LastModified = GETDATE()
        FROM Documents d
        JOIN inserted i ON d.DocID = i.DocID;
    END
END;
GO

-- TR4: Kiểm tra định dạng Email khi thêm/sửa User
CREATE OR ALTER TRIGGER trg_CheckValidEmail
ON Users
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted WHERE Email NOT LIKE '%_@__%.__%')
    BEGIN
        RAISERROR('Invalid email format.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- TR5: Ngăn chặn thêm danh mục trùng lặp (phân biệt hoa thường hoặc xử lý trim)
CREATE OR ALTER TRIGGER trg_PreventDuplicateCategory
ON Categories
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM Categories c
        JOIN inserted i ON LTRIM(RTRIM(LOWER(c.CatName))) = LTRIM(RTRIM(LOWER(i.CatName)))
        WHERE c.CatID <> i.CatID
    )
    BEGIN
        RAISERROR('Category name already exists.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- TR6: Ngăn chặn tương tác (Like/Comment) nếu tài liệu đang ở trạng thái Draft
CREATE OR ALTER TRIGGER trg_PreventInteractionOnDraft
ON Interactions
AFTER INSERT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN Documents d ON i.DocID = d.DocID
        WHERE d.Status = 'Draft'
    )
    BEGIN
        RAISERROR('Cannot like or comment on a draft document.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- TR7: Kiểm tra độ dài bình luận tối thiểu (phải có chữ)
CREATE OR ALTER TRIGGER trg_CheckCommentLength
ON Interactions
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM inserted 
        WHERE InteractionType = 'Comment' AND LEN(LTRIM(RTRIM(ISNULL(CommentText, '')))) = 0
    )
    BEGIN
        RAISERROR('Comment text cannot be empty.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- TR8: Chuyển đổi trạng thái User thành Inactive thay vì xóa
CREATE OR ALTER TRIGGER trg_SoftDeleteUser
ON Users
INSTEAD OF DELETE
AS
BEGIN
    UPDATE Users SET Status = 'Inactive' WHERE UserID IN (SELECT UserID FROM deleted);
END;
GO

-- TR9: Ghi log khi đổi Role của người dùng
CREATE OR ALTER TRIGGER trg_LogUserRoleChange
ON Users
AFTER UPDATE
AS
BEGIN
    IF UPDATE(Role)
    BEGIN
        INSERT INTO SystemLogs (LogMessage)
        SELECT 'User ' + i.Username + ' role changed from ' + d.Role + ' to ' + i.Role
        FROM inserted i JOIN deleted d ON i.UserID = d.UserID
        WHERE i.Role <> d.Role;
    END
END;
GO

-- TR10: Ngăn chặn tạo Tag trùng lặp (nếu insert số lượng nhiều)
CREATE OR ALTER TRIGGER trg_PreventDuplicateTagName
ON Tags
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT TagName FROM Tags GROUP BY TagName HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR('Duplicate TagName detected.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO


---------------------------------------------------------
-- D. CURSORS (4)
---------------------------------------------------------

-- CUR1: Duyệt danh sách tài liệu để gửi thông báo email định kỳ cho người dùng
CREATE OR ALTER PROCEDURE sp_Cursor_SendWeeklyEmail
AS
BEGIN
    DECLARE @DocTitle NVARCHAR(255);
    DECLARE @Author NVARCHAR(100);
    DECLARE @Msg NVARCHAR(MAX) = 'Weekly Digest:\n';
    
    DECLARE doc_cursor CURSOR FOR 
        SELECT Title, u.FullName 
        FROM Documents d JOIN Users u ON d.AuthorID = u.UserID
        WHERE d.PostDate >= DATEADD(day, -7, GETDATE());
        
    OPEN doc_cursor;
    FETCH NEXT FROM doc_cursor INTO @DocTitle, @Author;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Msg = @Msg + '- ' + @DocTitle + ' (by ' + @Author + ')\n';
        FETCH NEXT FROM doc_cursor INTO @DocTitle, @Author;
    END;
    
    CLOSE doc_cursor;
    DEALLOCATE doc_cursor;
    
    -- Lưu log hệ thống
    INSERT INTO SystemLogs (LogMessage) VALUES ('Sent Weekly Digest: ' + @Msg);
    PRINT @Msg; -- Minh họa việc gửi Email
END;
GO

-- CUR2: Duyệt toàn bộ bảng Documents để tính toán lại số view (ví dụ audit/sync log)
CREATE OR ALTER PROCEDURE sp_Cursor_RecalculateStats
AS
BEGIN
    DECLARE @DocID INT;
    DECLARE @ActualLikes INT;
    
    DECLARE stat_cursor CURSOR FOR SELECT DocID FROM Documents;
    
    OPEN stat_cursor;
    FETCH NEXT FROM stat_cursor INTO @DocID;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Giả sử hệ thống có cột TotalLikes trong Documents, ta sẽ cập nhật nó.
        -- Hiện tại chỉ ghi log quá trình recalculate
        SELECT @ActualLikes = dbo.fn_CountLikes(@DocID);
        INSERT INTO SystemLogs (LogMessage) VALUES ('DocID ' + CAST(@DocID AS NVARCHAR) + ' has ' + CAST(@ActualLikes AS NVARCHAR) + ' verified likes.');
        
        FETCH NEXT FROM stat_cursor INTO @DocID;
    END;
    
    CLOSE stat_cursor;
    DEALLOCATE stat_cursor;
END;
GO

-- CUR3: Cursor tự động lưu trữ (Archive) các tài liệu cũ (đã đăng hơn 2 năm)
CREATE OR ALTER PROCEDURE sp_Cursor_ArchiveOldDocuments
AS
BEGIN
    DECLARE @DocID INT;
    DECLARE @Title NVARCHAR(255);
    DECLARE @ArchiveCount INT = 0;
    
    DECLARE archive_cursor CURSOR FOR 
        SELECT DocID, Title FROM Documents 
        WHERE PostDate < DATEADD(year, -2, GETDATE()) AND Status <> 'Archived';
        
    OPEN archive_cursor;
    FETCH NEXT FROM archive_cursor INTO @DocID, @Title;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        UPDATE Documents SET Status = 'Archived' WHERE DocID = @DocID;
        SET @ArchiveCount = @ArchiveCount + 1;
        FETCH NEXT FROM archive_cursor INTO @DocID, @Title;
    END;
    
    CLOSE archive_cursor;
    DEALLOCATE archive_cursor;
    
    IF @ArchiveCount > 0
        INSERT INTO SystemLogs (LogMessage) VALUES ('Archived ' + CAST(@ArchiveCount AS NVARCHAR) + ' old documents.');
END;
GO

-- CUR4: Cursor dọn dẹp các Tags không được sử dụng
CREATE OR ALTER PROCEDURE sp_Cursor_CleanUpUnusedTags
AS
BEGIN
    DECLARE @TagID INT;
    DECLARE @TagName NVARCHAR(50);
    DECLARE @CleanCount INT = 0;
    
    DECLARE tag_cursor CURSOR FOR 
        SELECT t.TagID, t.TagName 
        FROM Tags t
        LEFT JOIN DocTags dt ON t.TagID = dt.TagID
        WHERE dt.DocID IS NULL;
        
    OPEN tag_cursor;
    FETCH NEXT FROM tag_cursor INTO @TagID, @TagName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DELETE FROM Tags WHERE TagID = @TagID;
        SET @CleanCount = @CleanCount + 1;
        INSERT INTO SystemLogs (LogMessage) VALUES ('Deleted unused tag: ' + @TagName);
        FETCH NEXT FROM tag_cursor INTO @TagID, @TagName;
    END;
    
    CLOSE tag_cursor;
    DEALLOCATE tag_cursor;
    
    IF @CleanCount > 0
        INSERT INTO SystemLogs (LogMessage) VALUES ('Cleaned up ' + CAST(@CleanCount AS NVARCHAR) + ' unused tags.');
END;
GO


---------------------------------------------------------
-- E. AN TOÀN THÔNG TIN (XÁC THỰC/PHÂN QUYỀN & BACKUP)
---------------------------------------------------------

-- 1. Tạo các Roles
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'AdminRole')
    CREATE ROLE AdminRole;
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'EditorRole')
    CREATE ROLE EditorRole;
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ViewerRole')
    CREATE ROLE ViewerRole;
GO

-- 2. Gán quyền (Permissions)
-- Admin
GRANT SELECT, INSERT, UPDATE, DELETE ON Documents TO AdminRole;
GRANT SELECT, INSERT, UPDATE, DELETE ON Categories TO AdminRole;
GRANT SELECT, INSERT, UPDATE, DELETE ON Tags TO AdminRole;
GRANT SELECT, INSERT, UPDATE, DELETE ON Users TO AdminRole;
GRANT EXECUTE TO AdminRole;

-- Editor
GRANT SELECT, INSERT, UPDATE ON Documents TO EditorRole;
GRANT SELECT ON Categories TO EditorRole;
GRANT SELECT ON Tags TO EditorRole;
GRANT EXECUTE ON OBJECT::dbo.sp_AddDocument TO EditorRole;
GRANT EXECUTE ON OBJECT::dbo.sp_UpdateDocumentStats TO EditorRole;

-- Viewer
GRANT SELECT ON Documents TO ViewerRole;
GRANT SELECT ON Categories TO ViewerRole;
GRANT SELECT ON Tags TO ViewerRole;
GRANT EXECUTE ON OBJECT::dbo.sp_SearchDocument TO ViewerRole;
GRANT EXECUTE ON OBJECT::dbo.sp_GetDocDetails TO ViewerRole;
GO

-- 3. Backup / Restore
CREATE OR ALTER PROCEDURE sp_BackupDocumentDB
    @FilePath NVARCHAR(255)
AS
BEGIN
    BACKUP DATABASE DocumentDB 
    TO DISK = @FilePath
    WITH FORMAT, MEDIANAME = 'DocSysBackups', NAME = 'Full Backup of DocumentDB';
    PRINT 'Backup successful.';
END;
GO

CREATE OR ALTER PROCEDURE sp_RestoreDocumentDB
    @FilePath NVARCHAR(255)
AS
BEGIN
    ALTER DATABASE DocumentDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE DocumentDB FROM DISK = @FilePath WITH REPLACE;
    ALTER DATABASE DocumentDB SET MULTI_USER;
    PRINT 'Restore successful.';
END;
GO


---------------------------------------------------------
-- F. TRÌNH BÀY THÔNG TIN (5 REPORTS CHO SSRS/WEB)
---------------------------------------------------------

-- Report 1: Top 10 tài liệu được tìm kiếm / xem nhiều nhất
CREATE OR ALTER PROCEDURE sp_Report_TopDocuments
AS
BEGIN
    SELECT TOP 10 
        DocID, Title, ViewCount, dbo.fn_CountLikes(DocID) AS TotalLikes, PostDate
    FROM Documents
    ORDER BY ViewCount DESC, TotalLikes DESC;
END;
GO

-- Report 2: Thống kê số lượng bài đăng theo tháng trong năm nay
CREATE OR ALTER PROCEDURE sp_Report_MonthlyPosts
    @Year INT = NULL
AS
BEGIN
    IF @Year IS NULL SET @Year = YEAR(GETDATE());
    
    SELECT 
        MONTH(PostDate) AS [Month],
        COUNT(DocID) AS TotalDocuments
    FROM Documents
    WHERE YEAR(PostDate) = @Year
    GROUP BY MONTH(PostDate)
    ORDER BY [Month];
END;
GO

-- Report 3: Báo cáo danh sách người dùng hoạt động tích cực
CREATE OR ALTER PROCEDURE sp_Report_ActiveUsers
AS
BEGIN
    SELECT TOP 20
        u.UserID, 
        u.FullName,
        (SELECT COUNT(*) FROM Documents WHERE AuthorID = u.UserID) AS TotalPosts,
        (SELECT COUNT(*) FROM Interactions WHERE UserID = u.UserID AND InteractionType = 'Comment') AS TotalComments
    FROM Users u
    ORDER BY TotalPosts DESC, TotalComments DESC;
END;
GO

-- Report 4: Thống kê dung lượng lưu trữ (số lượng tài liệu) theo danh mục
CREATE OR ALTER PROCEDURE sp_Report_StorageByCategory
AS
BEGIN
    SELECT 
        c.CatName,
        dbo.fn_CountDocsByCategory(c.CatID) AS TotalDocuments,
        -- Giả lập dung lượng bằng cách đếm số ký tự của Content (Bytes)
        SUM(ISNULL(LEN(d.Content) * 2, 0)) AS EstimatedSizeBytes 
    FROM Categories c
    LEFT JOIN Documents d ON c.CatID = d.CategoryID
    GROUP BY c.CatID, c.CatName
    ORDER BY TotalDocuments DESC;
END;
GO

-- Report 5: Báo cáo các từ khóa xu hướng (Trending keywords)
CREATE OR ALTER PROCEDURE sp_Report_TrendingKeywords
    @Days INT = 30
AS
BEGIN
    SELECT TOP 10 
        SearchQuery, 
        COUNT(*) AS SearchCount
    FROM SearchLogs
    WHERE SearchTime >= DATEADD(day, -@Days, GETDATE())
    GROUP BY SearchQuery
    ORDER BY SearchCount DESC;
END;
GO

-- Report 6: Thống kê trạng thái tài liệu (Document Status Distribution)
CREATE OR ALTER PROCEDURE sp_Report_DocumentStatus
AS
BEGIN
    SELECT 
        Status,
        COUNT(DocID) AS TotalDocuments
    FROM Documents
    GROUP BY Status
    ORDER BY TotalDocuments DESC;
END;
GO

-- Report 7: Tổng hợp Tương tác theo loại (Interactions by Type)
CREATE OR ALTER PROCEDURE sp_Report_InteractionsSummary
AS
BEGIN
    SELECT 
        InteractionType,
        COUNT(InteractionID) AS TotalCount
    FROM Interactions
    GROUP BY InteractionType
    ORDER BY TotalCount DESC;
END;
GO

-- Report 8: Top 10 Thẻ (Tags) phổ biến nhất
CREATE OR ALTER PROCEDURE sp_Report_TopTags
AS
BEGIN
    SELECT TOP 10 
        t.TagName,
        COUNT(dt.DocID) AS UsageCount
    FROM Tags t
    JOIN DocTags dt ON t.TagID = dt.TagID
    GROUP BY t.TagID, t.TagName
    ORDER BY UsageCount DESC;
END;
GO
