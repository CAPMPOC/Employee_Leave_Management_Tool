const cds = require('@sap/cds');

module.exports = cds.service.impl(srv => {
  const { Header, LeaveTypes, LeaveBalances, LeaveRequests, HolidayCalendar, Attachments, AuditLog, Notifications } = srv.entities;

  const has = (req, role) => req.user.is(role);

  async function me(req) { return await cds.run(SELECT.one.from(Header).where({ empNo: req.user.id })); }

  srv.on('READ', 'LeaveRequests', async (req, next) => {
    const emp = await me(req); if (!emp) return req.reject(403, 'Unknown employee identity');
    if (has(req,'HR')) return next();
    if (has(req,'Manager')) { req.query.where(`employee_ID.manager_ID = '${emp.ID}' OR employee_ID = '${emp.ID}'`); return next(); }
    if (has(req,'Employee')) { req.query.where({ employee_ID: emp.ID }); return next(); }
    req.reject(403,'Unauthorized');
  });
})