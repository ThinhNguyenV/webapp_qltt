USE DocumentDB;
GO

---------------------------------------------------------
-- 1. BẢNG USERS (Người dùng)
---------------------------------------------------------
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Role NVARCHAR(20) DEFAULT 'User' CHECK (Role IN ('Admin', 'User', 'Editor')),
    RegistrationDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Active'
);
GO

---------------------------------------------------------
-- 2. BẢNG CATEGORIES (Danh mục)
---------------------------------------------------------
CREATE TABLE Categories (
    CatID INT IDENTITY(1,1) PRIMARY KEY,
    CatName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255)
);
GO

---------------------------------------------------------
-- 3. BẢNG TAGS (Thẻ phân loại)
---------------------------------------------------------
CREATE TABLE Tags (
    TagID INT IDENTITY(1,1) PRIMARY KEY,
    TagName NVARCHAR(50) NOT NULL UNIQUE
);
GO

---------------------------------------------------------
-- 4. BẢNG DOCUMENTS (Tài liệu/Sản phẩm)
---------------------------------------------------------
CREATE TABLE Documents (
    DocID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Summary NVARCHAR(500),
    Content NVARCHAR(MAX) NOT NULL,
    AuthorID INT NOT NULL,
    CategoryID INT NOT NULL,
    PostDate DATETIME DEFAULT GETDATE(),
    ViewCount INT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'Published',
    LastModified DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AuthorID) REFERENCES Users(UserID),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CatID)
);
GO

---------------------------------------------------------
-- 5. BẢNG DOCTAGS (Liên kết Tài liệu và Thẻ)
---------------------------------------------------------
CREATE TABLE DocTags (
    DocID INT NOT NULL,
    TagID INT NOT NULL,
    PRIMARY KEY (DocID, TagID),
    FOREIGN KEY (DocID) REFERENCES Documents(DocID) ON DELETE CASCADE,
    FOREIGN KEY (TagID) REFERENCES Tags(TagID) ON DELETE CASCADE
);
GO

---------------------------------------------------------
-- 6. BẢNG SEARCHLOGS (Nhật ký tìm kiếm)
---------------------------------------------------------
CREATE TABLE SearchLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL, -- Có thể NULL nếu user chưa đăng nhập
    SearchQuery NVARCHAR(255) NOT NULL,
    SearchTime DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

---------------------------------------------------------
-- 7. BẢNG INTERACTIONS (Tương tác: Yêu thích, Bình luận)
---------------------------------------------------------
CREATE TABLE Interactions (
    InteractionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    DocID INT NOT NULL,
    InteractionType NVARCHAR(20) CHECK (InteractionType IN ('Like', 'Comment')),
    CommentText NVARCHAR(500) NULL,
    InteractionDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (DocID) REFERENCES Documents(DocID) ON DELETE CASCADE
);
GO

---------------------------------------------------------
-- 8. BẢNG DELETEDDOCUMENTSLOG (Nhật ký xóa tài liệu)
---------------------------------------------------------
CREATE TABLE DeletedDocumentsLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    DocID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    DeletedBy NVARCHAR(50) NULL, -- User perform delete (if captured) or SYSTEM
    DeletedAt DATETIME DEFAULT GETDATE()
);
GO

---------------------------------------------------------
-- 9. BẢNG SYSTEMLOGS (Nhật ký hệ thống chung cho Cursors)
---------------------------------------------------------
CREATE TABLE SystemLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    LogMessage NVARCHAR(MAX),
    LogDate DATETIME DEFAULT GETDATE()
);
GO
