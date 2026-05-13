import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { getMembers, approveMember, rejectMember, renewMember } from '../lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const STATUS_VARIANTS = { approved: 'default', pending: 'secondary', rejected: 'outline' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MembersPage() {
  const { token, user } = useAuth();
  const isSectionEditor = user?.role === 'section_editor';

  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState('all');
  const [stateFilter, setStateFilter] = useState(isSectionEditor ? (user?.section || '') : '');
  const [search, setSearch]           = useState('');
  const [busy, setBusy]               = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setMembers(await getMembers(token));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id, action, label) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      const fn = action === 'approve' ? approveMember
               : action === 'reject'  ? rejectMember
               : renewMember;
      await fn(token, id);
      toast.success(`Member ${label}.`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  // Collect distinct states from results for the filter dropdown
  const stateOptions = [...new Set(members.map(m => m.state).filter(Boolean))].sort();

  const visible = members.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (stateFilter && m.state?.toLowerCase() !== stateFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.name?.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Members</h1>
        <Button variant="outline" size="sm" onClick={load}>↻ Refresh</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status pills */}
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {s}
          </button>
        ))}

        {/* State filter — locked for section_editor */}
        <Select
          value={stateFilter || '__all__'}
          onValueChange={v => !isSectionEditor && setStateFilter(v === '__all__' ? '' : v)}
          disabled={isSectionEditor}
        >
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            {!isSectionEditor && <SelectItem value="__all__">All states</SelectItem>}
            {stateOptions.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-52"
        />

        <span className="text-xs text-muted-foreground ml-auto">{visible.length} result{visible.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>State</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!loading && !visible.length && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No members found.</TableCell></TableRow>
            )}
            {visible.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium whitespace-nowrap">{m.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                <TableCell className="text-sm">{m.state || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.city || '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[m.status] ?? 'outline'} className="capitalize">
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(m.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(m.expires_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-1.5 flex-wrap">
                    {m.status === 'pending' && (
                      <>
                        <Button size="sm" disabled={busy[m.id]}
                          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => doAction(m.id, 'approve', 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy[m.id]}
                          className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => doAction(m.id, 'reject', 'rejected')}>
                          Reject
                        </Button>
                      </>
                    )}
                    {m.status === 'approved' && (
                      <Button size="sm" variant="outline" disabled={busy[m.id]}
                        className="h-7 px-2 text-xs"
                        onClick={() => doAction(m.id, 'renew', 'renewed (+1 year)')}>
                        Renew
                      </Button>
                    )}
                    {m.status === 'rejected' && (
                      <Button size="sm" variant="outline" disabled={busy[m.id]}
                        className="h-7 px-2 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        onClick={() => doAction(m.id, 'approve', 'approved')}>
                        Approve
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
