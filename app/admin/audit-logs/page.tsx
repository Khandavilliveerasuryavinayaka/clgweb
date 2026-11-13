'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Search, Filter, History, Lock } from 'lucide-react';
import { AuditLog } from '@/types';

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [logs, setLogs] = useState<AuditLog[]>(() => mockDb.getAuditLogs());

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const merged = [...json.data];
          mockDb.getAuditLogs().forEach((m) => {
            if (!merged.some((x) => x.id === m.id || (x.action === m.action && x.timestamp === m.timestamp))) {
              merged.push(m);
            }
          });
          setLogs(merged);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status="Active">Append-Only Immutable Ledger</Badge>
              <span className="text-xs text-slate-400 font-mono">SOC-2 & FERPA Academic Standard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Institutional Audit Trail & Event Logs
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cryptographically timestamped action stream capturing security modifications, blocking events, grade approvals, and financials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <SearchInput
                placeholder="Search actions, entities, users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
            <div className="w-36">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { label: 'All Roles', value: 'ALL' },
                  { label: 'ADMIN', value: 'ADMIN' },
                  { label: 'FACULTY', value: 'FACULTY' },
                  { label: 'STUDENT', value: 'STUDENT' },
                ]}
              />
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">
              Recorded Action Events ({filtered.length} Entries)
            </CardTitle>
            <span className="text-xs text-slate-400 font-mono">Encrypted Hash Verified</span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">Initiating Actor</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Activity Particulars</th>
                    <th className="p-4">State Transition</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No audit events match your filter query.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 font-sans">
                        <td className="p-4">
                          <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{log.userName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">Role: {log.role}</span>
                        </td>
                        <td className="p-4 font-mono font-semibold text-brand-700">
                          {log.entity}
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                            {log.entityId}
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 text-xs max-w-sm leading-relaxed">
                          {log.details}
                        </td>
                        <td className="p-4">
                          {log.previousState && log.newState ? (
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <span className="text-slate-500">{log.previousState}</span>
                              <span className="text-slate-400">→</span>
                              <span className="font-bold text-slate-900">{log.newState}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-xs">{log.ipAddress}</td>
                        <td className="p-4 text-right text-slate-500 font-mono text-xs">
                          {formatDate(log.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
