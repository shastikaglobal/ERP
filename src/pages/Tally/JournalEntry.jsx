import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Plus, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

const ACCOUNTS = [
  'Cash Account','Bank — HDFC','Sales Account','Purchase Account',
  'CGST Payable','SGST Payable','IGST Payable','Raj Exports',
  'Priya Traders','Office Rent','Salary Expense','Capital Account',
  'Sundry Debtors','Stock in Hand',
]

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
      className="force-gold-input rounded-[8px] px-[14px] py-[10px] w-[250px] overflow-hidden text-ellipsis whitespace-nowrap text-sm transition-colors"
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

  const addRow = () => setRows((r) => [...r, { account: '', drcr: 'Dr', debit: '', credit: '', gst: 'None' }])
  const delRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))
  const upd = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)))

  const totDr = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0)
  const totCr = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0)
  const diff = Math.abs(totDr - totCr)
  const canPost = diff === 0 && !saving && totDr > 0

  const saveEntry = async (status) => {
    if (status === 'Posted' && !canPost) {
      if (totDr === 0) return toast.error('Total debit must be greater than 0 to post.')
      return toast.error('Voucher must be balanced before posting (Difference: ₹' + diff.toFixed(2) + ')')
    }
    setSaving(true)
    try {
      const voucherNo = `JV-${Math.floor(1000 + Math.random() * 9000)}`
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{ 
          voucher_no: voucherNo, 
          voucher_type: voucherType, 
          date, 
          reference_no: referenceNo, 
          narration, 
          status, 
          total_debit: totDr, 
          total_credit: totCr 
        }])
        .select('id')
        .single()

      if (entryError) console.error("Insert error:", entryError)
      
      if (entry?.id) {
        const rowPayload = rows.map((row) => ({
          journal_entry_id: entry.id,
          account: row.account,
          drcr: row.drcr,
          debit: parseFloat(row.debit) || 0,
          credit: parseFloat(row.credit) || 0,
          gst_percent: row.gst,
          gst_amount: row.gst !== 'None' ? parseFloat(((parseFloat(row.debit) || 0) * parseFloat(row.gst) / 100).toFixed(2)) : 0,
        }))
        await supabase.from('journal_entry_rows').insert(rowPayload).catch(() => {})
      } else {
        await supabase.from('journal_entries').insert([{ 
          entry_no: voucherNo, 
          date, 
          description: voucherType, 
          reference_no: referenceNo, 
          debit_account: rows[0]?.account,
          credit_account: rows[1]?.account,
          amount: totDr, 
          currency: 'INR',
          narration 
        }]).catch(() => {})
      }

      toast.success(`Entry ${status} successfully`)
      setVoucherType('Journal Voucher')
      setDate(today)
      setReferenceNo('')
      setNarration('')
      setRows(DEFAULT_ROWS)
      onSaved?.()
    } catch (error) {
      toast.error('Unable to save journal entry.')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    if (saving) return;
    saveEntry('Draft');
  };

  const handlePostEntry = () => {
    if (saving) return;
    saveEntry('Posted');
  };

  return (
    <div className="mb-8 space-y-6">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-[12px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="force-gold-text font-[700] text-[24px] tracking-tight">New Journal Voucher</h2>
          <p className="text-[#888888] text-[13px] mt-1">Enter voucher details, narration, and GST values in a clean ledger workflow.</p>
        </div>
        <div className="flex items-center mt-4 sm:mt-0 relative z-10">
          <button
            type="button"
            onClick={handleSaveDraft}
            style={{
              background: 'transparent',
              border: '1.5px solid #f0a500',
              color: '#f0a500',
              borderRadius: '8px',
              padding: '10px 24px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Save Draft
          </button>
          
          <button
            type="button"
            onClick={handlePostEntry}
            style={{
              background: '#f0a500',
              border: '1.5px solid #f0a500',
              color: '#000000',
              borderRadius: '8px',
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              marginLeft: '12px',
            }}
          >
            Post Entry
          </button>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-[12px] p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
        <div>
          <label className="uppercase tracking-[1.5px] text-[11px] force-gold-text font-[600] mb-2 block">Voucher Type</label>
          <select value={voucherType} onChange={(e) => setVoucherType(e.target.value)} className="force-gold-input rounded-[8px] px-[14px] py-[10px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm appearance-none cursor-pointer transition-colors">
            <option>Journal Voucher</option><option>Payment Voucher</option>
            <option>Receipt Voucher</option><option>Sales Voucher</option>
            <option>Purchase Voucher</option><option>Contra Voucher</option>
          </select>
        </div>
        <div>
          <label className="uppercase tracking-[1.5px] text-[11px] force-gold-text font-[600] mb-2 block">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="force-gold-input rounded-[8px] px-[14px] py-[10px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm transition-colors" />
        </div>
        <div>
          <label className="uppercase tracking-[1.5px] text-[11px] force-gold-text font-[600] mb-2 block">Voucher No</label>
          <input type="text" readOnly value="Auto generated" className="bg-[#0f0f0f] border border-[#333] text-[#666] rounded-[8px] px-[14px] py-[10px] w-full focus:outline-none overflow-hidden text-ellipsis whitespace-nowrap text-sm cursor-not-allowed" />
        </div>
        <div>
          <label className="uppercase tracking-[1.5px] text-[11px] force-gold-text font-[600] mb-2 block">Reference No</label>
          <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Invoice / PO No." className="force-gold-input rounded-[8px] px-[14px] py-[10px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm placeholder:text-[#555] transition-colors" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="uppercase tracking-[1.5px] text-[11px] force-gold-text font-[600] mb-2 block">Narration</label>
          <textarea value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Describe the nature of this transaction..." className="force-gold-input rounded-[8px] px-[14px] py-[10px] w-full text-sm min-h-[80px] resize-y placeholder:text-[#555] transition-colors" />
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-[12px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#161616] border-b border-[#2a2a2a]">
                <th className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-6 font-[600]">Account / Ledger</th>
                <th className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-4 font-[600] text-center" style={{ width: '130px' }}>Dr / Cr</th>
                <th className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-6 font-[600] text-right" style={{ width: '160px' }}>Debit (₹)</th>
                <th className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-6 font-[600] text-right" style={{ width: '160px' }}>Credit (₹)</th>
                <th className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-4 font-[600] text-center" style={{ width: '110px' }}>GST %</th>
                <th className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-6 font-[600] text-right" style={{ width: '140px' }}>GST Amt</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="bg-[#0f0f0f] border-b border-[#1f1f1f]">
                  <td className="py-3 px-6">
                    <select value={row.account} onChange={e => upd(i, 'account', e.target.value)} className="force-gold-input rounded-[8px] px-[14px] py-[8px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm appearance-none transition-colors">
                      <option value="">Select Account</option>
                      {ACCOUNTS.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex bg-[#0f0f0f] border border-[#333] rounded-full p-1 w-full h-full min-h-[34px]">
                      <button
                        type="button"
                        onClick={() => upd(i, 'drcr', 'Dr')}
                        className={`flex-1 rounded-full text-[11px] font-bold py-1 px-2 transition-colors ${row.drcr === 'Dr' ? 'bg-[#3a0000] text-[#ff4444] border border-[#ff4444]' : 'bg-[#1a1a1a] text-[#555] border border-transparent hover:text-white'}`}
                      >
                        DR
                      </button>
                      <button
                        type="button"
                        onClick={() => upd(i, 'drcr', 'Cr')}
                        className={`flex-1 rounded-full text-[11px] font-bold py-1 px-2 transition-colors ${row.drcr === 'Cr' ? 'bg-[#003a00] text-[#44ff88] border border-[#44ff88]' : 'bg-[#1a1a1a] text-[#555] border border-transparent hover:text-white'}`}
                      >
                        CR
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <input type="number" disabled={row.drcr === 'Cr'} value={row.drcr === 'Dr' ? row.debit : ''} onChange={e => upd(i, 'debit', e.target.value)} placeholder="0.00" className={`force-gold-input rounded-[8px] px-[14px] py-[8px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm placeholder:text-[#444] font-mono text-right transition-colors ${row.drcr === 'Dr' ? 'text-[#ff6b6b]' : 'text-[#444] cursor-not-allowed border-transparent bg-[#141414]'}`} />
                  </td>
                  <td className="py-3 px-6">
                    <input type="number" disabled={row.drcr === 'Dr'} value={row.drcr === 'Cr' ? row.credit : ''} onChange={e => upd(i, 'credit', e.target.value)} placeholder="0.00" className={`force-gold-input rounded-[8px] px-[14px] py-[8px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm placeholder:text-[#444] font-mono text-right transition-colors ${row.drcr === 'Cr' ? 'text-[#4ade80]' : 'text-[#444] cursor-not-allowed border-transparent bg-[#141414]'}`} />
                  </td>
                  <td className="py-3 px-4">
                    <select value={row.gst} onChange={e => upd(i, 'gst', e.target.value)} className="force-gold-input text-center rounded-[8px] px-[10px] py-[8px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm appearance-none transition-colors" style={{ color: '#ccc' }}>
                      <option>None</option><option>5%</option><option>12%</option><option>18%</option><option>28%</option>
                    </select>
                  </td>
                  <td className="py-3 px-6">
                    <input type="text" readOnly value={row.gst !== 'None' && row.debit ? `₹${(parseFloat(row.debit) * parseFloat(row.gst) / 100).toFixed(2)}` : ''} placeholder="Auto" className="bg-[#0f0f0f] border border-[#333] text-[#888] italic rounded-[8px] px-[14px] py-[8px] w-full focus:outline-none overflow-hidden text-ellipsis whitespace-nowrap text-sm cursor-not-allowed font-mono text-right" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button type="button" onClick={() => delRow(i)} className="text-[#555] hover:text-[#ff4444] transition-colors p-2"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-[#111]">
          <button 
            type="button" 
            onClick={addRow} 
            style={{
              width: '100%',
              border: '1.5px dashed #f0a500',
              color: '#f0a500',
              background: 'rgba(240,165,0,0.05)',
              padding: '12px 0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            + Add Row
          </button>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-[12px] px-6 py-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {diff === 0 && totDr > 0 ? (
            <div className="flex items-center gap-2 text-[#f0a500] font-semibold text-lg">
              <CheckCircle2 size={20} /> Balanced
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#ff4444] font-semibold text-lg">
              <AlertTriangle size={20} /> {totDr === 0 ? 'Enter valid amounts' : `Difference: ₹${diff.toFixed(2)}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="uppercase tracking-[1px] text-[11px] force-gold-text mb-1 font-[600]">Total Debit</span>
            <span className="font-mono text-[#ff6b6b] font-[700] text-[22px]">₹{totDr.toFixed(2)}</span>
          </div>
          <div className="w-[1px] h-10 bg-[#333]"></div>
          <div className="flex flex-col items-end">
            <span className="uppercase tracking-[1px] text-[11px] force-gold-text mb-1 font-[600]">Total Credit</span>
            <span className="font-mono text-[#4ade80] font-[700] text-[22px]">₹{totCr.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JournalEntry() {
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = async () => {
    setLoading(true)
    try {
      let { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Fetch entries error:", error)
        data = []
      }
      setEntries(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const filtered = entries.filter((j) =>
    (j.narration || j.description || '').toLowerCase().includes(search.toLowerCase()) || 
    (j.voucher_no || j.entry_no || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 bg-[#0f0f0f] min-h-screen text-white pb-12">
      <style>{`
        .force-gold-text { color: #f0a500 !important; }
        .force-gold-input { background-color: #0f0f0f !important; border: 1px solid #333 !important; color: #fff !important; }
        .force-gold-input:focus { border-color: #f0a500 !important; box-shadow: 0 0 0 2px rgba(240,165,0,0.15) !important; outline: none !important; }
      `}</style>
      <PageHeader
        title="Journal Entry"
        breadcrumbs={[{ label: 'Home' }, { label: 'Accounts' }, { label: 'Journal Entry' }]}
        actions={
          <select className="bg-[#0f0f0f] border border-[#333] text-white rounded-[8px] px-[14px] py-[10px] text-sm focus:outline-none focus:border-[#f0a500] focus:shadow-[0_0_0_2px_rgba(240,165,0,0.15)] transition-colors">
            <option>March 2026</option><option>February 2026</option>
          </select>
        }
      />
      
      <NewEntryForm onSaved={fetchEntries} />

      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-[12px] shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-[#2a2a2a] bg-[#161616]">
          <div>
            <h3 className="force-gold-text font-bold text-lg">All Journal Entries</h3>
          </div>
          <SearchBar placeholder="Search vouchers..." value={search} onChange={(e) => setSearch(e.target.value)}>
            <select className="force-gold-input rounded-[8px] px-[14px] py-[10px] text-sm transition-colors">
              <option>All Types</option><option>Sales</option><option>Payment</option><option>Purchase</option>
            </select>
          </SearchBar>
        </div>
        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-[#888] gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading entries...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#888]">No journal entries found.</div>
          ) : (
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-[#161616] border-b border-[#2a2a2a]">
                  {['Date','Voucher No.','Type','Narration','Debit','Credit','Status'].map((h) => (
                    <th key={h} className="force-gold-text uppercase text-[11px] tracking-[1.5px] py-4 px-6 font-[600] whitespace-nowrap overflow-hidden text-ellipsis">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="bg-[#0f0f0f] border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                    <td className="py-4 px-6 font-mono text-[12px] text-[#888] whitespace-nowrap">{r.date}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-[#f0a500] font-semibold text-[13px]">{r.voucher_no || r.entry_no}</span>
                    </td>
                    <td className="py-4 px-6 text-[12px] text-[#888] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{r.voucher_type || r.description || 'Journal'}</td>
                    <td className="py-4 px-6 text-[13px] text-[#ddd] overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{r.narration}</td>
                    <td className="py-4 px-6 text-[#ff6b6b] font-mono text-[13px] whitespace-nowrap">{(r.total_debit || r.amount) ? Number(r.total_debit || r.amount).toLocaleString('en-IN') : '—'}</td>
                    <td className="py-4 px-6 text-[#4ade80] font-mono text-[13px] whitespace-nowrap">{(r.total_credit || r.amount) ? Number(r.total_credit || r.amount).toLocaleString('en-IN') : '—'}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge className={r.status === 'Posted' ? 'bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/30 shadow-none' : 'bg-[#333]/50 text-[#888] border border-[#444] shadow-none'}>
                        {r.status || 'Posted'}
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
