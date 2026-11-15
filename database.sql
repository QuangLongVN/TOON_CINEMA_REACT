IF DB_ID('ToonCinema') IS NULL
BEGIN
    CREATE DATABASE ToonCinema;
END
GO

USE ToonCinema;
GO

-- ========================================
-- BẢNG PHIM
-- ========================================

IF OBJECT_ID('dbo.Movies', 'U') IS NULL
BEGIN
    CREATE TABLE Movies (
        MovieID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Genre NVARCHAR(100) NOT NULL,
        Duration INT NOT NULL CHECK (Duration > 0),
        ImageUrl NVARCHAR(500),
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END
GO

-- ========================================
-- BẢNG PHÒNG CHIẾU
-- ========================================

IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
BEGIN
    CREATE TABLE Rooms (
        RoomID INT IDENTITY(1,1) PRIMARY KEY,
        RoomName NVARCHAR(100) NOT NULL,
        RowCount INT NOT NULL DEFAULT 10,
        SeatPerRow INT NOT NULL DEFAULT 8
    );
END
GO

-- ========================================
-- BẢNG LỊCH CHIẾU
-- ========================================

IF OBJECT_ID('dbo.Showtimes', 'U') IS NULL
BEGIN
    CREATE TABLE Showtimes (
        ShowtimeID INT IDENTITY(1,1) PRIMARY KEY,
        MovieID INT NOT NULL,
        RoomID INT NOT NULL,
        StartTime DATETIME2 NOT NULL,
        TicketPrice DECIMAL(12,2) NOT NULL DEFAULT 60000,

        CONSTRAINT FK_Showtimes_Movies
            FOREIGN KEY (MovieID)
            REFERENCES Movies(MovieID),

        CONSTRAINT FK_Showtimes_Rooms
            FOREIGN KEY (RoomID)
            REFERENCES Rooms(RoomID)
    );
END
GO

-- ========================================
-- BẢNG GHẾ ĐÃ ĐẶT
-- ========================================

IF OBJECT_ID('dbo.BookedSeats', 'U') IS NULL
BEGIN
    CREATE TABLE BookedSeats (
        BookingID INT IDENTITY(1,1) PRIMARY KEY,
        ShowtimeID INT NOT NULL,
        SeatCode VARCHAR(5) NOT NULL,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

        CONSTRAINT FK_BookedSeats_Showtimes
            FOREIGN KEY (ShowtimeID)
            REFERENCES Showtimes(ShowtimeID),

        CONSTRAINT UQ_BookedSeats
            UNIQUE (ShowtimeID, SeatCode)
    );
END
GO

-- ========================================
-- THÊM PHÒNG CHIẾU MẪU
-- ========================================

IF NOT EXISTS (SELECT 1 FROM Rooms)
BEGIN
    INSERT INTO Rooms (RoomName, RowCount, SeatPerRow)
    VALUES
        (N'Phòng 1', 10, 8),
        (N'Phòng 2', 10, 8),
        (N'Phòng 3', 10, 8);
END
GO

-- ========================================
-- KIỂM TRA DỮ LIỆU
-- ========================================

SELECT * FROM Movies;
SELECT * FROM Rooms;
SELECT * FROM Showtimes;
SELECT * FROM BookedSeats;