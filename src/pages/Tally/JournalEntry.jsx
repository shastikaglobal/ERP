import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/badge'
import { Tag } from '../../components/ui/tag'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Plus, Trash2, Save, CheckCheck, AlertTriangle, Lock, Loader2 } from 'lucide-react'

const statusVariant = { Posted: 'default', Draft: 'secondary' }



const DEFAULT_ROWS = [
  { account: '', drcr: 'Dr', debit: '', credit: '', gst: 'None' },
  { account: '', drcr: 'Cr', debit: '', credit: '', gst: 'None' },
]

const today = new Date().toISOString().slice(0, 10)

const SearchBar = ({ placeholder, value, onChange, children }) => (
  <div className="flex flex-wrap items-center gap-2">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input-field text-xs py-2 px-3 min-w-[200px] rounded-xl"
    />
    {children}
  </div>
)

function NewEntryForm({ onSaved }) {
  const [voucherType, setVoucherType] = useState('Journal Voucher')
  const [date, setDate] = useState(today)
  const [referenceNo, setReferenceNo] = useState('')
  const [narration, setNarration] = useState('')
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const [saving, setSaving] = useState(false)
  const [accountsList, setAccountsList] = useState([
    'Cash Account', 'Bank — HDFC', 'Sales Account', 'Purchase Account',
    'CGST Payable', 'SGST Payable', 'IGST Payable', 'Office Rent', 
    'Salary Expense', 'Capital Account', 'Sundry Debtors', 'Stock in Hand'
  ])

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { data: customers } = await supabase.from('customers').select('name')
        const { data: suppliers } = await supabase.from('suppliers').select('name')
        
        const dynamicAccounts = [
          ...accountsList,
          ...(customers?.map(c => c.name) || []),
          ...(suppliers?.map(s => s.name) || [])
        ]
        setAccountsList([...new Set(dynamicAccounts)].sort())
      } catch (err) {
        console.error("Failed to load dynamic accounts", err)
      }
    }
    loadAccounts()
  }, [])

  const addRow = () => setRows((r) => [...r, { account: '', drcr: 'Dr', debit: '', credit: '', gst: 'None' }])
  const delRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))
  const upd = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)))

  const totDr = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0)
  const totCr = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0)
  const diff = Math.abs(totDr - totCr)
  const canPost = diff === 0 && !saving

  const saveEntry = async (status) => {
    setSaving(true)
    try {
      const voucherNo = `JV-${Math.floor(1000 + Math.random() * 9000)}`
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{ voucher_no: voucherNo, voucher_type: voucherType, date, reference_no: referenceNo, narration, status, total_debit: totDr, total_credit: totCr }])
        .select('id')
        .single()

      if (entryError) throw entryError
      if (!entry?.id) throw new Error('Unable to create journal entry')

      const rowPayload = rows.map((row) => ({
        journal_entry_id: entry.id,
        account: row.account,
        drcr: row.drcr,
        debit: parseFloat(row.debit) || 0,
        credit: parseFloat(row.credit) || 0,
        gst_percent: row.gst,
        gst_amount: row.gst !== 'None' ? parseFloat(((parseFloat(row.debit) || 0) * parseFloat(row.gst) / 100).toFixed(2)) : 0,
      }))

      const { error: rowError } = await supabase.from('journal_entry_rows').insert(rowPayload)
      if (rowError) throw rowError

      toast.success(`${status} saved successfully`)
      setVoucherType('Journal Voucher')
      setDate(today)
      setReferenceNo('')
      setNarration('')
      setRows(DEFAULT_ROWS)
      onSaved?.()
    } catch (error) {
      toast.error('Unable to save journal entry. Please try again.')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] shadow-lg border-t-2 border-t-[#F59E0B]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-[#2a2a2a] bg-[#0f0f0f]/80">
        <div>
          <h3 className="text-xl font-semibold text-white">New Journal Voucher</h3>
          <p className="mt-1 text-sm text-[#4a4a4a]">Enter voucher details, narration, and GST values in a clean ledger workflow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveEntry('Draft')}
            disabled={saving}
            className="bg-[#111111] border border-[#333333] text-slate-200 text-xs py-1.5 min-w-[110px] rounded-lg flex items-center gap-2 hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={13} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => saveEntry('Posted')}
            disabled={!canPost}
            className={`min-w-[110px] rounded-lg text-xs py-1.5 flex items-center gap-2 justify-center border shadow-lg transition-all ${canPost ? 'bg-[#F59E0B] border-[#F59E0B] text-[#080808] hover:bg-[#D97706] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40' : 'bg-[#3f3f3f] border-[#4b4b4b] text-[#9ca3af] cursor-not-allowed shadow-none'}`}
          >
            <CheckCheck size={13} /> {saving ? 'Posting...' : 'Post Entry'}
          </button>
        </div>
      </div>

      <div className="p-6 grid gap-4 lg:grid-cols-4 border-b border-[#2a2a2a]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Voucher Type</div>
          <select value={voucherType} onChange={(e) => setVoucherType(e.target.value)} className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-2 px-3 placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]">
            <option>Journal Voucher</option><option>Payment Voucher</option>
            <option>Receipt Voucher</option><option>Sales Voucher</option>
            <option>Purchase Voucher</option><option>Contra Voucher</option>
          </select>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Date</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-2 px-3 placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] mb-2 flex items-center gap-1">Voucher No. <Lock size={10} className="text-[#4a4a4a]" /></div>
          <input type="text" readOnly value="Auto generated" className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-2 px-3 opacity-50 cursor-not-allowed" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Reference No.</div>
          <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Invoice / PO No." className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-2 px-3 placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]" />
        </div>
        <div className="lg:col-span-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Narration</div>
          <textarea rows={3} style={{ height: '60px' }} value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Describe the nature of this transaction..." className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-2 px-3 placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B] resize-none" />
        </div>
      </div>

      <div className="overflow-x-auto bg-[#0f0f0f]/70">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <th className="tbl-th py-3 font-mono text-[10px] text-[#4a4a4a] uppercase tracking-widest w-[30%]">Account / Ledger</th>
              <th className="tbl-th py-3 font-mono text-[10px] text-[#4a4a4a] uppercase tracking-widest w-20">Dr / Cr</th>
              <th className="tbl-th py-3 font-mono text-[10px] text-[#4a4a4a] uppercase tracking-widest">Debit (₹)</th>
              <th className="tbl-th py-3 font-mono text-[10px] text-[#4a4a4a] uppercase tracking-widest">Credit (₹)</th>
              <th className="tbl-th py-3 font-mono text-[10px] text-[#4a4a4a] uppercase tracking-widest">GST %</th>
              <th className="tbl-th py-3 font-mono text-[10px] text-[#4a4a4a] uppercase tracking-widest">GST Amt</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-[#2a2a2a]/60 hover:border-l-2 hover:border-l-[#F59E0B] transition-colors ${i % 2 === 0 ? 'bg-[#111111]' : 'bg-[#141414]'}`}>
                <td className="px-4 py-3">
                  <select value={row.account} onChange={e => upd(i, 'account', e.target.value)} className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-1.5 px-3 placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]">
                    <option value="">— Select Account —</option>
                    {accountsList.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 bg-[#1a1a1a] rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => upd(i, 'drcr', 'Dr')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${row.drcr === 'Dr' ? 'bg-[#dc2626] text-white' : 'bg-[#333333] text-[#4a4a4a] hover:bg-[#4a4a4a]'}`}
                    >
                      Dr
                    </button>
                    <button
                      type="button"
                      onClick={() => upd(i, 'drcr', 'Cr')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${row.drcr === 'Cr' ? 'bg-[#16a34a] text-white' : 'bg-[#333333] text-[#4a4a4a] hover:bg-[#4a4a4a]'}`}
                    >
                      Cr
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3"><input type="number" value={row.debit} onChange={e => upd(i, 'debit', e.target.value)} placeholder="0.00" className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-1.5 px-3 font-mono placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]" /></td>
                <td className="px-4 py-3"><input type="number" value={row.credit} onChange={e => upd(i, 'credit', e.target.value)} placeholder="0.00" className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-1.5 px-3 font-mono placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]" /></td>
                <td className="px-4 py-3">
                  <select value={row.gst} onChange={e => upd(i, 'gst', e.target.value)} className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-white text-xs py-1.5 px-3 placeholder-[#4a4a4a] focus:border-[#F59E0B] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] hover:border-[#F59E0B]">
                    <option>None</option><option>5%</option><option>12%</option><option>18%</option><option>28%</option>
                  </select>
                </td>
                <td className="px-4 py-3"><input type="text" readOnly value={row.gst !== 'None' && row.debit ? `₹${(parseFloat(row.debit) * parseFloat(row.gst) / 100).toFixed(2)}` : ''} placeholder="Auto" className="w-full bg-[#1c1c1c] border border-[#333333] rounded-lg text-[#F59E0B] text-xs py-1.5 px-3 font-mono opacity-50 italic" /></td>
                <td className="px-3 py-3 text-right"><button type="button" onClick={() => delRow(i)} className="text-[#4a4a4a] hover:text-red-400 transition-colors"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#0f0f0f]/80 border-t border-[#2a2a2a]">
              <td colSpan={2} className="px-4 py-4 text-sm font-mono">
                {diff === 0
                  ? <span className="text-emerald-400 font-semibold text-lg shadow-sm shadow-emerald-500/20">✓ Balanced — Ready to Post</span>
                  : <div className="flex items-center gap-2 text-red-400 text-lg"><AlertTriangle size={16} /> Difference: ₹{diff.toFixed(2)} — Cannot Post</div>
                }
              </td>
              <td className="px-4 py-4 font-mono font-bold text-red-400 text-lg">₹{totDr.toFixed(2)}</td>
              <td className="px-4 py-4 font-mono font-bold text-emerald-400 text-lg">₹{totCr.toFixed(2)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-[#2a2a2a] bg-[#0f0f0f]/80">
        <div className="flex flex-col gap-2">
          <button type="button" onClick={addRow} className="bg-[#F59E0B] border border-[#F59E0B] text-black text-xs py-1.5 rounded-lg shadow-lg flex items-center gap-2 w-fit hover:bg-[#D97706]">
            <Plus size={13} /> Add Row
          </button>
          <p className="text-xs text-[#4a4a4a] italic">Voucher balanced entries are auto-checked before posting.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 text-[#4a4a4a] text-xs">
          <span>Total Debit <strong className="font-semibold text-red-400">₹{totDr.toFixed(2)}</strong></span>
          <span>Total Credit <strong className="font-semibold text-emerald-400">₹{totCr.toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
  )
}

export default function JournalEntry() {
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(true)

  const fetchEntries = async () => {
    setLoadingEntries(true)
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load journal entries.')
        console.error(error)
      } else {
        setEntries(data || [])
      }
    } catch (error) {
      toast.error('Unable to load journal entries.')
      console.error(error)
    } finally {
      setLoadingEntries(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const filtered = entries.filter((j) =>
    j.narration?.toLowerCase().includes(search.toLowerCase()) || j.voucher_no?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entry"
        breadcrumbs={[{ label: 'Home' }, { label: 'Accounts' }, { label: 'Journal Entry' }]}
        actions={
          <select className="select-field w-36 text-xs">
            <option>March 2026</option><option>February 2026</option>
          </select>
        }
      />
      <NewEntryForm onSaved={fetchEntries} />

      <div className="overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-border bg-card/80">
          <div>
            <h3 className="text-lg font-semibold text-white">All Journal Entries</h3>
            <p className="text-xs text-slate-500 mt-1">Review completed vouchers and draft status in one warm dashboard panel.</p>
          </div>
          <SearchBar placeholder="Search vouchers..." value={search} onChange={(e) => setSearch(e.target.value)}>
            <select className="select-field w-36 text-xs">
              <option>All Types</option><option>Sales</option><option>Payment</option><option>Purchase</option>
            </select>
          </SearchBar>
        </div>
        <div className="overflow-x-auto bg-card/70">
          {loadingEntries ? (
            <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading journal entries...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No journal entries found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/80">
                  {['Date','Voucher No.','Type','Narration','Debit','Credit','Status'].map((h) => (
                    <th key={h} className="tbl-th tbl-header py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="tbl-row hover:bg-amber-500/5 transition-colors cursor-pointer">
                    <td className="tbl-cell font-mono text-xs text-slate-500">{r.date}</td>
                    <td className="tbl-cell"><Tag variant="gold">{r.voucher_no}</Tag></td>
                    <td className="tbl-cell text-xs text-slate-500 font-mono">{r.voucher_type}</td>
                    <td className="tbl-cell text-slate-300">{r.narration}</td>
                    <td className="tbl-cell dr">{r.total_debit ? Number(r.total_debit).toLocaleString('en-IN') : '—'}</td>
                    <td className="tbl-cell cr">{r.total_credit ? Number(r.total_credit).toLocaleString('en-IN') : '—'}</td>
                    <td className="tbl-cell">
                      <Badge className={r.status === 'Posted' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
