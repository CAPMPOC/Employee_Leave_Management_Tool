namespace leavemgmt;

type DayGranularity : String enum {
    FULL;
    HALF;
}

type LeaveStatus    : String enum {
    PENDING;
    PENDING_HR;
    APPROVED;
    REJECTED;
    OVERRIDDEN;
    CANCELLED;
}

entity Header {
    key ID         : UUID;
    key empNo      : String(50) @mandatory;
        name       : String(100);
        email      : String(200);
        department : String(60);
        manager_ID : Association to Header;
        isManager  : Boolean default false;
        isHR       : Boolean default false;
        active     : Boolean default true;
}

entity LeaveTypes {
    key code                       : String(20); // ANNUAL, SICK, UNPAID, COMPOFF
        name                       : String(60);
        requiresNote               : Boolean default false;
        requiresAttachmentIfDaysGt : Integer default 0; // e.g., SICK -> 2
        maxConsecutiveDays         : Integer default 30;
        allowHalfDay               : Boolean default true;
}

entity LeaveBalances {
    key employee_ID : Association to Header;
    key type_code   : Association to LeaveTypes;
        balanceDays : Decimal(6, 2) default 0;
}

entity HolidayCalendar {
    key date : Date;
        name : String(100);
}

entity LeaveRequests {
    key ID          : UUID;
        employee_ID : Association to Header;
        type_code   : Association to LeaveTypes;
        startDate   : Date;
        endDate     : Date;
        granularity : DayGranularity default #FULL;
        daysCount   : Decimal(6, 2);
        status      : LeaveStatus default #PENDING;
        approver_ID : Association to Header;
        level       : Integer default 1;
        note        : String(500);
        createdAt   : Timestamp;
        updatedAt   : Timestamp;
}

entity Attachments {
    key ID        : UUID;
        leave_ID  : Association to LeaveRequests;

        @Core.MediaType: mimeType
        content   : LargeBinary @stream;

        @Core.ContentDisposition.Filename: fileName
        fileName  : String;

        @Core.IsMediaType                : true
        mimeType  : String;
        sizeBytes : Integer;
}

entity AuditLog {
    key ID         : UUID;
        leave_ID   : Association to LeaveRequests;
        actor_ID   : Association to Header;
        action     : String(40);
        fromStatus : String(20);
        toStatus   : String(20);
        comment    : String(500);
        at         : Timestamp;
}

entity Notifications {
    key ID           : UUID;
        recipient_ID : Association to Header;
        title        : String(120);
        message      : String(500);
        createdAt    : Timestamp;
        read         : Boolean default false;
}

entity Me @(readonly) {
    key id     : String;
        email  : String;
        roles  : array of String;
        emp_ID : UUID;
        name   : String;
}
