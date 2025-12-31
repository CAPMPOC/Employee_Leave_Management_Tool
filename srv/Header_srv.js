const cds = require('@sap/cds');

module.exports = cds.service.impl(srv => {
  const { Header, LeaveTypes, LeaveBalances, LeaveRequests, HolidayCalendar, Attachments, AuditLog, Notifications } = srv.entities;

  const has = (req, role) => req.user.is(role);

  async function me(req) { return await cds.run(SELECT.one.from(Header).where({ empNo: req.user.id })); }

  // srv.on('READ', 'LeaveRequests', async (req, next) => {
  //   const emp = await me(req); if (!emp) return req.reject(403, 'Unknown employee identity');
  //   if (has(req, 'HR')) return next();
  //   if (has(req, 'Manager')) { req.query.where(`employee_ID.manager_ID = '${emp.ID}' OR employee_ID = '${emp.ID}'`); return next(); }
  //   if (has(req, 'Employee')) { req.query.where({ employee_ID: emp.ID }); return next(); }
  //   req.reject(403, 'Unauthorized');
  // });

  srv.on('READ', 'Me', async (req) => {
    const emp = await me(req);
    const roles = req.user.roles || [];
    return [
      { id: req.user.id, email: req.user.email, roles, emp_ID: emp?.ID, name: emp?.name }
    ];
  });

  srv.on('computeDays', async (req) => { const { startDate, endDate, granularity } = req.data; return await computeBusinessDays(startDate, endDate, granularity); });

  srv.on('applyLeave', async (req) => {
    const { employee_ID, type_code, startDate, endDate, granularity, note } = req.data;
    const emp = await cds.run(SELECT.one.from(Header).where({ ID: employee_ID })); if (!emp) req.reject(400, 'Employee not found');
    const type = await cds.run(SELECT.one.from(LeaveTypes).where({ code: type_code })); if (!type) req.reject(400, 'Leave type not found');
    const daysCount = await computeBusinessDays(startDate, endDate, granularity);
    if (granularity === 'HALF' && startDate !== endDate) req.reject(400, 'Half-day allowed only for single-day requests');
    if (type.maxConsecutiveDays && daysCount > type.maxConsecutiveDays) req.reject(400, `Max consecutive days (${type.maxConsecutiveDays}) exceeded`);
    if (granularity === 'HALF' && !type.allowHalfDay) req.reject(400, `${type.name} does not allow half-day`);
    const bal = await cds.run(SELECT.one.from(LeaveBalances).where({ employee_ID, type_code })); if (!bal || Number(bal.balanceDays) < Number(daysCount)) req.reject(400, 'Insufficient balance');
    if (!emp.manager_ID_ID) req.reject(400, 'No manager configured');
    const now = new Date(); const ID = cds.utils.uuid();
    await cds.run(INSERT.into(LeaveRequests).entries({ ID, employee_ID, type_code, startDate, endDate, granularity, daysCount, status: 'PENDING', approver_ID: emp.manager_ID_ID, level: 1, note, createdAt: now, updatedAt: now }));
    await logAudit(ID, employee_ID, 'APPLY', null, 'PENDING', note);
    await notify(emp.manager_ID_ID, 'New leave request', `Review request ${ID}`);
    return await cds.run(SELECT.one.from(LeaveRequests).where({ ID }));
  });
})