import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { getEventSummaries, getRegistrations, confirmRegistration, cancelRegistration } from '../lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const STATUS_VARIANTS = { confirmed: 'default', pending: 'secondary', cancelled: 'outline' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Event summary cards (level 1)
// ---------------------------------------------------------------------------

function EventCard({ event, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 bg-white rounded-lg border hover:border-gray-400 hover:shadow-sm transition-all w-full"
    >
      <h3 className="font-semibold text-sm mb-0.5 line-clamp-2">{event.event_title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{event.event_slug}</p>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{event.total} total</Badge>
        <Badge variant="default">{event.confirmed} confirmed</Badge>
        <Badge variant="outline">{event.pending} pending</Badge>
        {event.cancelled > 0 && <Badge variant="outline" className="text-red-500">{event.cancelled} cancelled</Badge>}
        <Badge variant="outline" className="text-muted-foreground">{event.total_participants} pax</Badge>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Registration table (level 2)
// ---------------------------------------------------------------------------

function RegistrationTable({ event, token, onBack }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatus]         = useState('all');
  const [busy, setBusy]                   = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRegistrations(await getRegistrations(token, event.event_slug));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, event.event_slug]);

  useEffect(() => { load(); }, [load]);

  async function doAction(id, action) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      const fn = action === 'confirm' ? confirmRegistration : cancelRegistration;
      await fn(token, id);
      toast.success(`Registration ${action === 'confirm' ? 'confirmed' : 'cancelled'}.`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(b => ({ ...b, [id]: false }));
    }
  }

  const visible = registrations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.name?.toLowerCase().includes(q) && !r.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = registrations.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {}
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-gray-900">
          ← Events
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{event.event_title}</span>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{event.total} total</Badge>
        <Badge variant="default">{counts.confirmed || 0} confirmed</Badge>
        <Badge variant="outline">{counts.pending || 0} pending</Badge>
        {(counts.cancelled || 0) > 0 && <Badge variant="outline" className="text-red-500">{counts.cancelled} cancelled</Badge>}
        <Badge variant="outline" className="text-muted-foreground">
          {registrations.reduce((s, r) => s + (r.participants || 1), 0)} total pax
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
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
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-52"
        />
        <Button variant="outline" size="sm" onClick={load} className="ml-auto">↻ Refresh</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Pax</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {!loading && !visible.length && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No registrations found.</TableCell></TableRow>
            )}
            {visible.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.phone || '—'}</TableCell>
                <TableCell className="text-sm text-center">{r.participants}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.notes || '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[r.status] ?? 'outline'} className="capitalize">{r.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    {r.status !== 'confirmed' && r.status !== 'cancelled' && (
                      <Button size="sm" disabled={busy[r.id]}
                        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => doAction(r.id, 'confirm')}>
                        Confirm
                      </Button>
                    )}
                    {r.status !== 'cancelled' && (
                      <Button size="sm" variant="outline" disabled={busy[r.id]}
                        className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => doAction(r.id, 'cancel')}>
                        Cancel
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

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function EventRegistrationsPage() {
  const { token } = useAuth();
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedEvent, setSelected] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setEvents(await getEventSummaries(token));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  if (selectedEvent) {
    return (
      <div className="p-6">
        <RegistrationTable
          event={selectedEvent}
          token={token}
          onBack={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Event Registrations</h1>
        <Button variant="outline" size="sm" onClick={loadEvents}>↻ Refresh</Button>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!loading && !events.length && (
        <p className="text-muted-foreground text-sm">No events with registrations yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map(ev => (
          <EventCard key={ev.event_slug} event={ev} onClick={() => setSelected(ev)} />
        ))}
      </div>
    </div>
  );
}
