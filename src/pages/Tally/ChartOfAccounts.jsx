import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Plus, CheckCircle, XCircle, Trash2, BookOpen, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

const DEFAULT_ACCOUNTS = [
  { code: '1001', name: 'Cash', group: 'Current Assets', type: 'Asset', balance: '₹4,20,000', gst: false, status: 'Active' },
  { code: '2001', name: 'Accounts Payable', group: 'Current Liabilities', type: 'Liability', balance: '₹3,12,000', gst: true, status: 'Active' },
  { code: '3001', name: 'Sales Revenue', group: 'Revenue', type: 'Income', balance: '₹15,00,000', gst: true, status: 'Active' },
  { code: '4001', name: 'Office Supplies', group: 'Expenses', type: 'Expense', balance: '₹35,000', gst: true, status: 'Active' },
  { code: '5001', name: 'Owner Capital', group: 'Equity', type: 'Equity', balance: '₹15,00,000', gst: false, status: 'Active' }
]

const SearchBar = ({ placeholder, value, onChange }) => (
  <input 
    type="text" 
    placeholder={placeholder} 
    value={value} 
    onChange={onChange} 
    style={{
      backgroundColor: '#0f0f0f',
      border: '1px solid #333',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '8px 14px',
      fontSize: '13px',
      minWidth: '220px',
      outline: 'none',
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#f0a500';
      e.target.style.boxShadow = '0 0 0 2px rgba(240,165,0,0.15)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#333';
      e.target.style.boxShadow = 'none';
    }}
  />
)

const TYPES = ['All','Asset','Equity','Liability','Income','Expense']
const GROUPS = [...new Set(DEFAULT_ACCOUNTS.map(a => a.group))]

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className={`relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm border-l-4 border-l-${accent}-500/80 p-5`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${accent}-500/10`}>
        <Icon size={20} className={`text-${accent}-400`} />
      </div>
      <div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1">{label}</div>
        <div className={`font-mono font-bold text-2xl text-${accent}-400`}>{value}</div>
      </div>
    </div>
  </div>
)

export default function ChartOfAccounts() {
  const { profile } = useAuth()
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .neq('is_deleted', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to load chart of accounts:', error)
      toast.error('Unable to load accounts. Showing defaults until the database is available.')
      setAccounts(DEFAULT_ACCOUNTS)
    } else {
      setAccounts(data || DEFAULT_ACCOUNTS)
    }

    setLoading(false)
  }

  const handleNewAccount = () => {
    const name = window.prompt("Enter new Account Name:");
    if (name && name.trim()) {
      const code = (Math.floor(Math.random() * 9000) + 1000).toString();
      const newAcc = { code, name: name.trim(), group: 'Expenses', type: 'Expense', balance: '₹0', gst: false, status: 'Active' };
      setAccounts([...accounts, newAcc]);
      toast.success(`${name.trim()} account created successfully!`);
    }
  }

  const handleDelete = async (code) => {
    if (!window.confirm('Are you sure you want to delete this account? It can be restored later.')) {
      return
    }

    setDeleting(code)
    const { error } = await supabase
      .from('chart_of_accounts')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: profile?.id || null
      })
      .eq('code', code)

    setDeleting(null)

    if (error) {
      console.error('Soft delete error:', error)
      toast.error('Unable to delete account. Please try again.')
      return
    }

    setAccounts(accounts.filter((a) => a.code !== code))
    toast.success('Account marked as deleted (soft-deleted)')
  }

  const filtered = accounts.filter((a) => {
    if (a.is_deleted) return false
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || a.code?.includes(search)
    const matchType = typeFilter === 'All' || a.type === typeFilter
    return matchSearch && matchType
  })

  const groups = Array.from(new Set(filtered.map((a) => a.group))).sort()
  const grouped = groups.reduce((acc, g) => {
    const rows = filtered.filter((a) => a.group === g)
    if (rows.length) acc[g] = rows
    return acc
  }, {})

  const groupTints = {
    'Current Assets': 'bg-blue-500/10',
    'Current Liabilities': 'bg-red-500/10',
    'Revenue': 'bg-emerald-500/10',
    'Expenses': 'bg-amber-500/10',
    'Equity': 'bg-indigo-500/10'
  }

  const typeColors = {
    Asset: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    Liability: 'bg-red-500/10 text-red-300 border-red-500/20',
    Income: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    Expense: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    Equity: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
  }

  const balanceColors = {
    Asset: 'text-emerald-400',
    Liability: 'text-red-400',
    Income: 'text-emerald-400',
    Expense: 'text-red-400',
    Equity: 'text-emerald-400'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        breadcrumbs={[{ label: 'Home' }, { label: 'Masters' }, { label: 'Chart of Accounts' }]}
        actions={
          <button 
            onClick={handleNewAccount}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f0a500',
              color: '#000000',
              border: '1.5px solid #f0a500',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(240,165,0,0.3)',
            }}
          >
            <Plus size={15} /> New Account
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <StatCard icon={BookOpen} label="Total Accounts" value={accounts.length} accent="indigo" />
        <StatCard icon={TrendingUp} label="Assets" value={accounts.filter(a=>a.type==='Asset').length} accent="blue" />
        <StatCard icon={TrendingDown} label="Liabilities" value={accounts.filter(a=>a.type==='Liability').length} accent="red" />
        <StatCard icon={DollarSign} label="Income" value={accounts.filter(a=>a.type==='Income').length} accent="emerald" />
        <StatCard icon={PieChart} label="Expenses" value={accounts.filter(a=>a.type==='Expense').length} accent="amber" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/70 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80 flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-white">All Accounts ({filtered.length})</h3>
          <div className="flex items-center gap-3">
            <SearchBar placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-1">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ...(typeFilter === t
                      ? {
                          background: '#f0a500',
                          color: '#000',
                          border: '1px solid #f0a500',
                          boxShadow: '0 0 8px rgba(240,165,0,0.3)'
                        }
                      : {
                          background: 'transparent',
                          color: '#888',
                          border: '1px solid #333'
                        })
                  }}
                  onMouseEnter={(e) => {
                    if (typeFilter !== t) e.target.style.background = 'rgba(240,165,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (typeFilter !== t) e.target.style.background = 'transparent';
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-card/70">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen size={48} className="text-amber-400 mb-4" />
              <h4 className="text-lg font-semibold text-slate-300 mb-2">No accounts found</h4>
              <p className="text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/80">
                  {['Code','Account Name','Group','Type','Closing Balance','GST','Status',''].map(h => (
                    <th key={h} className="tbl-th tbl-header py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([group, rows]) => [
                  <tr key={`g-${group}`} className={`${groupTints[group]} border-y border-border/50`}>
                    <td colSpan={8} className="px-4 py-3 text-sm font-bold text-white uppercase tracking-wider">{group}</td>
                  </tr>,
                  ...rows.map((a, i) => (
                    <tr key={i} className="tbl-row hover:bg-amber-500/5 transition-colors cursor-pointer">
                      <td className="tbl-cell font-mono text-xs text-slate-500">{a.code}</td>
                      <td className="tbl-cell font-semibold text-slate-200">{a.name}</td>
                      <td className="tbl-cell text-slate-500 text-xs">{a.group}</td>
                      <td className="tbl-cell">
                        <Badge className={typeColors[a.type]}>
                          {a.type}
                        </Badge>
                      </td>
                      <td className={`tbl-cell font-mono text-xs font-semibold ${balanceColors[a.type]}`}>{a.balance}</td>
                      <td className="tbl-cell">
                        {a.gst
                          ? <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold"><CheckCircle size={11} /> GST</span>
                          : <span className="flex items-center gap-1 text-slate-600 text-xs"><XCircle size={11} /> No</span>
                        }
                      </td>
                      <td className="tbl-cell">
                        <Badge className={a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="tbl-cell">
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-amber-400 hover:text-amber-300 font-medium">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(a.code); }} className="text-xs text-red-400 hover:text-red-300 font-medium"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ])}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
