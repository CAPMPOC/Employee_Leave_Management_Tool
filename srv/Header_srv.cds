using {leavemgmt} from '../db/Header';

service LeaveService @(impl: './Header_srv.js') {
    entity Header          as select from leavemgmt.Header;
    entity LeaveBalances   as select from leavemgmt.LeaveBalances;
    entity LeaveTypes      as select from leavemgmt.LeaveTypes;
    entity HolidayCalendar as select from leavemgmt.HolidayCalendar;
    entity LeaveRequests   as select from leavemgmt.LeaveRequests;
    entity Attachments     as select from leavemgmt.Attachments; // media streaming
    entity AuditLog        as select from leavemgmt.AuditLog;
    entity Notifications   as select from leavemgmt.Notifications;
    entity Me              as select from leavemgmt.Me;
}
