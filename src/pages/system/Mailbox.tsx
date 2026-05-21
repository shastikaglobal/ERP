import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Send as SendIcon, Paperclip, Loader2, User, History, X, FileText, Plus,
  Inbox, Star, Clock, File as FileIcon, ChevronDown, RefreshCw, MoreVertical,
  CheckSquare, ArrowLeft, Reply, Forward, Search, SlidersHorizontal, Settings as SettingsIcon
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getDefaultSignature = (profile: any) => {
  if (!profile) return "";
  
  const name = profile.full_name || profile.email?.split("@")[0] || "Employee";
  
  // Format role
  let role = "Business Development Executive";
  if (profile.requested_role) {
    const matched = [
      { slug: "admin", label: "Admin" },
      { slug: "manager", label: "Manager" },
      { slug: "bd", label: "Business Development Executive" },
      { slug: "bde", label: "Business Development Executive" },
      { slug: "accounts", label: "Accounts Manager" },
      { slug: "operations", label: "Operations Executive" },
      { slug: "qc", label: "Quality Control Specialist" },
      { slug: "procurement", label: "Procurement Specialist" },
      { slug: "data_analyst", label: "Data Analyst" },
      { slug: "marketing", label: "Marketing Specialist" },
      { slug: "hr", label: "HR Manager" },
    ].find(r => r.slug === profile.requested_role.toLowerCase());
    
    if (matched) {
      role = matched.label;
    } else {
      role = profile.requested_role.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
  }

  const company = profile.company_name || "Shastika Global Impex Private Limited";
  const isBde = profile.requested_role && ["bd", "bde"].includes(profile.requested_role.toLowerCase());
  const email = isBde ? "bde@shastikaglobalimpex.co.in" : (profile.email || "bde@shastikaglobalimpex.co.in");
  const phone = profile.phone || "+91 95662 66228";
  const whatsapp = "+91 95662 66241"; // WhatsApp number from screenshot
  const logoUrl = window.location.origin + "/logo.webp";

  return `
    <p>Warm Regards,</p>
    <p><br></p>
    <table cellpadding="0" cellspacing="0" style="border: none; font-family: Verdana, sans-serif; font-size: 10pt; line-height: 1.4; border-collapse: collapse; background: transparent;">
      <tr>
        <td style="vertical-align: top; padding-right: 15px; border: none;">
          <img src="${logoUrl}" alt="Logo" style="width: 80px; height: auto; display: block;" width="80" />
        </td>
        <td style="vertical-align: top; padding-left: 15px; border-left: 2px solid #38bdf8; border-top: none; border-bottom: none; border-right: none;">
          <div style="font-weight: bold; font-size: 11pt; color: inherit; margin-bottom: 2px;">${name}</div>
          <div style="font-size: 9.5pt; margin-bottom: 2px; opacity: 0.8;">${role}</div>
          <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 4px;">${company}</div>
          <div style="font-size: 9pt; opacity: 0.8; margin-top: 6px; line-height: 1.5;">
            WhatsApp: <a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${whatsapp}</a><br>
            Phone: <span>${phone}</span><br>
            Email: <a href="mailto:${email}" style="color: #38bdf8; text-decoration: underline;">${email}</a><br>
            Web: <a href="https://shastikaglobal.co.in" target="_blank" style="color: #38bdf8; text-decoration: underline;">https://shastikaglobal.co.in</a>
          </div>
        </td>
      </tr>
    </table>
  `;
};

export default function Mailbox() {
  const { profile, refresh, roleSlugs } = useAuth();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Compose
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // History & Views
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mail Settings Dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [savingSignature, setSavingSignature] = useState(false);

  useEffect(() => {
    if (profile?.email_signature) {
      setSignatureText(profile.email_signature);
    } else if (profile) {
      setSignatureText(getDefaultSignature(profile));
    }
  }, [profile?.email_signature, isSettingsOpen]);

  const handleSaveSignature = async () => {
    if (!profile?.id) return;
    setSavingSignature(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ email_signature: signatureText })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      await refresh();
      toast.success("Email signature saved successfully!");
      setIsSettingsOpen(false);
    } catch (err: any) {
      toast.error("Failed to save signature: " + err.message);
    } finally {
      setSavingSignature(false);
    }
  };

  // Search Filters
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [showSearchOptions, setShowSearchOptions] = useState(false);

  // Live status tracking
  const [emailStatuses, setEmailStatuses] = useState<Record<string, string>>({});

  // Realtime connection status
  const [isConnected, setIsConnected] = useState(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleSelectEmail = async (email: any) => {
    setSelectedEmail(email);
    setIsComposing(false);
    
    if ((!email.body_html || !email.body_html.includes('<div')) && email.zoho_message_id) {
      setLoadingBody(true);
      try {
        const { data, error } = await supabase.functions.invoke("get-zoho-email-body", {
          body: {
            accountId: email.account_id,
            messageId: email.zoho_message_id,
            emailId: email.id,
            folderName: email.folder
          }
        });
        if (data?.success && data.content) {
          setSelectedEmail((prev: any) => prev?.id === email.id ? { 
            ...prev, 
            body_html: data.content,
            attachments: data.attachments || prev.attachments
          } : prev);
          
          setSentEmails((prev) => prev.map(e => e.id === email.id ? { 
            ...e, 
            body_html: data.content,
            attachments: data.attachments || e.attachments
          } : e));
        }
      } catch (err) {
        console.error("Failed to fetch full email body", err);
      } finally {
        setLoadingBody(false);
      }
    }
  };

  const handleForceFetchEmail = async (email: any) => {
    if (!email.zoho_message_id) return;
    setLoadingBody(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-zoho-email-body", {
        body: {
          accountId: email.account_id,
          messageId: email.zoho_message_id,
          emailId: email.id,
          folderName: email.folder
        }
      });
      if (data?.success && data.content) {
        if (data.debug) {
          console.log("Zoho API Attachment Debug Info:", data.debug);
        }
        setSelectedEmail((prev: any) => prev?.id === email.id ? { 
          ...prev, 
          body_html: data.content,
          attachments: data.attachments || prev.attachments
        } : prev);
        
        setSentEmails((prev) => prev.map(e => e.id === email.id ? { 
          ...e, 
          body_html: data.content,
          attachments: data.attachments || e.attachments
        } : e));

        if (data.attachments && data.attachments.length > 0) {
          toast.success(`Found ${data.attachments.length} attachments!`);
        } else {
          toast.info("Message loaded, no attachments found on the server.");
        }
      } else {
        toast.error("Failed to load message details: " + (data?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to fetch full email body", err);
      toast.error("Error communicating with server.");
    } finally {
      setLoadingBody(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchAccounts();
    }
  }, [profile?.id]);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const isBde = roleSlugs?.has("bd") || 
                    roleSlugs?.has("bde") || 
                    (profile?.requested_role && ["bd", "bde"].includes(profile.requested_role.toLowerCase()));

      let query = supabase.from("zoho_accounts").select("*");
      
      if (isBde) {
        query = query.or(`user_id.eq.${profile?.id},account_email.eq.bde@shastikaglobalimpex.co.in`);
      } else {
        query = query.eq("user_id", profile?.id);
      }

      const { data, error } = await query;

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data && data.length > 0) {
        setAccounts(data);
        const bdeAccount = data.find(acc => acc.account_email === "bde@shastikaglobalimpex.co.in");
        const defaultAccountId = bdeAccount ? bdeAccount.id : data[0].id;
        setSelectedAccount(defaultAccountId);
        await fetchHistory(defaultAccountId);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory(accountId: string) {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("account_id", accountId)
      .order("received_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setSentEmails(data);
    }
  }

  async function syncEmails(accountId: string, isManual = false) {
    if (!accountId) return;
    if (isManual) setIsManualSyncing(true);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-zoho-emails", {
        body: { accountId }
      });
      
      if (error) {
        console.error("Sync error:", error);
        if (isManual) toast.error(`Sync error: ${error.message}`);
        return;
      }

      if (data?.success === false) {
        console.error("Sync failed:", data.error);
        if (isManual) toast.error(`Sync failed: ${data.error}`);
        return;
      }

      await fetchHistory(accountId);
      if (isManual) {
        toast.success(`Synced ${data?.syncCount || 0} messages!`);
      }
    } catch (err: any) {
      console.error("Unexpected sync error:", err);
      if (isManual) toast.error(`Unexpected sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
      if (isManual) setIsManualSyncing(false);
    }
  }

  // Background polling sync every 60 seconds
  useEffect(() => {
    if (!selectedAccount) return;
    
    // Initial sync on mount/account change
    syncEmails(selectedAccount, false);

    const interval = setInterval(() => {
      syncEmails(selectedAccount, false);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [selectedAccount]);

  // Realtime subscription with full live update support
  useEffect(() => {
    if (!selectedAccount) return;

    const channel = supabase
      .channel(`live-mailbox-${selectedAccount}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails",
          filter: `account_id=eq.${selectedAccount}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const { id, status, subject } = payload.new;

            // Update live status badge instantly
            setEmailStatuses(prev => ({ ...prev, [id]: status }));

            // Update email in list without full refresh
            setSentEmails(prev =>
              prev.map(e => e.id === id ? { ...e, ...payload.new } : e)
            );

            // Show toast based on status
            if (status === "sent") {
              toast.success(`✓ Delivered: ${subject}`, {
                id: `sending-${id}`,
                duration: 4000,
                icon: "📨",
              });
            } else if (status === "failed") {
              toast.error(`✗ Failed to send: ${subject}`, {
                id: `sending-${id}`,
                duration: 6000,
                icon: "⚠️",
              });
            }
          }

          if (payload.eventType === "INSERT") {
            // New email — add to top of list instantly
            setSentEmails(prev => {
              const exists = prev.find(e => e.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev];
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [selectedAccount]);

  const handleSend = async () => {
    if (sending) return;

    if (!selectedAccount || !to || !subject || !content) {
      return toast.error("Please fill all required fields");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return toast.error("Invalid email address");
    }

    try {
      setSending(true);

      const account = accounts.find((a) => a.id === selectedAccount);
      if (!account) return toast.error("Account not found");

      // Step 1: Upload attachments first
      const uploadedAttachments = [];
      for (const file of attachments) {
        const filePath = `mailbox/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("email-attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        uploadedAttachments.push({
          filename: file.name,
          path: filePath,
          contentType: file.type,
        });
      }

      const plainText = content
        .replace(/<(.|\n)*?>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Step 2: Insert as draft first
      const { data: emailRow, error: insertError } = await supabase
        .from("emails")
        .insert({
          to_address: to,
          from_address: account.account_email,
          subject: subject,
          body_html: content,
          body_text: plainText,
          status: "draft",
          folder: "sent",
          received_at: new Date().toISOString(),
          company_id: profile?.company_id,
          account_id: account.id,
          attachments: uploadedAttachments.length > 0
            ? uploadedAttachments
            : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Step 3: Set to pending → triggers DB webhook automatically
      const { error: updateError } = await supabase
        .from("emails")
        .update({ status: "pending" })
        .eq("id", emailRow.id);

      if (updateError) throw updateError;

      // UI feedback — Realtime will update actual status live
      toast.info("Sending email...", { id: `sending-${emailRow.id}`, duration: 10000 });
      setTo("");
      setSubject("");
      setContent("");
      setAttachments([]);
      setIsComposing(false);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const folders = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: sentEmails.filter(e => !e.folder || e.folder.toLowerCase() === "inbox").length },
    { id: "starred", label: "Starred", icon: Star },
    { id: "snoozed", label: "Snoozed", icon: Clock },
    { id: "sent", label: "Sent", icon: SendIcon, count: sentEmails.filter(e => e.folder?.toLowerCase() === "sent").length },
    { id: "drafts", label: "Drafts", icon: FileIcon, count: sentEmails.filter(e => e.folder?.toLowerCase() === "draft" || e.folder?.toLowerCase() === "drafts").length },
  ];

  // Filter emails by active folder and search query
  const filteredEmails = sentEmails.filter(email => {
    // 1. Filter by active folder (case-insensitive)
    const folderName = email.folder?.toLowerCase() || 'inbox';
    
    if (activeFolder === "inbox") {
      // Inbox includes 'inbox' or default undefined folder, but excludes 'sent' or 'draft'
      if (folderName !== "inbox") return false;
    } else if (activeFolder === "sent") {
      if (folderName !== "sent") return false;
    } else if (activeFolder === "drafts") {
      if (folderName !== "draft" && folderName !== "drafts") return false;
    } else if (activeFolder === "starred") {
      if (!email.is_starred) return false;
    } else if (activeFolder === "snoozed") {
      if (folderName !== "snoozed") return false;
    }

    // 2. Filter by Has Attachment search option
    if (filterHasAttachment) {
      const hasAttachments = email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0;
      if (!hasAttachments) return false;
    }

    // 3. Filter by Unread search option
    if (filterUnreadOnly) {
      if (email.is_read) return false;
    }

    // 4. Filter by Date Range search option
    if (filterDateRange !== "all") {
      const date = new Date(email.received_at || email.created_at);
      const diffMs = Date.now() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (filterDateRange === "today" && diffDays > 1) return false;
      if (filterDateRange === "week" && diffDays > 7) return false;
      if (filterDateRange === "month" && diffDays > 30) return false;
    }

    // 5. Filter by search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(q) ||
      email.from_address?.toLowerCase().includes(q) ||
      email.to_address?.toLowerCase().includes(q) ||
      email.body_text?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col pt-0 w-full overflow-hidden bg-[#0c0c0e]">
      {/* Top Header / Search */}
      <div className="flex items-center gap-4 py-4 px-8 shrink-0 bg-[#0c0c0e] border-b border-zinc-800/80">
        <div className="flex items-center gap-3 w-64 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/30">
            <Mail className="h-5 w-5 text-amber-500" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-zinc-100">Mailbox</span>
        </div>
        
        <div className="flex-1 max-w-2xl relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <Input 
              placeholder="Search mail by subject, sender, or content..." 
              className="pl-11 pr-12 h-11 bg-[#141416] border-zinc-800/80 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 focus-visible:bg-[#0c0c0e] transition-all rounded-full text-sm w-full shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => setShowSearchOptions(!showSearchOptions)}
              className={`absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-amber-500 transition-colors ${
                showSearchOptions || filterHasAttachment || filterUnreadOnly || filterDateRange !== 'all' ? 'text-amber-500 font-bold' : ''
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Search Options Dropdown Popover */}
          {showSearchOptions && (
            <div className="absolute top-13 left-0 right-0 bg-[#161618] border border-zinc-800 rounded-2xl p-5 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Search & Filter Options</span>
                {(filterHasAttachment || filterUnreadOnly || filterDateRange !== "all") && (
                  <button 
                    onClick={() => {
                      setFilterHasAttachment(false);
                      setFilterUnreadOnly(false);
                      setFilterDateRange("all");
                    }}
                    className="text-[11px] font-bold text-amber-500 hover:underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Has Attachment Switch */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400">Attachments</label>
                  <button
                    onClick={() => setFilterHasAttachment(!filterHasAttachment)}
                    className={`flex items-center justify-center h-10 px-4 rounded-xl text-xs font-medium border transition-all ${
                      filterHasAttachment 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold' 
                        : 'border-zinc-800 bg-[#1e1e22]/50 text-zinc-400 hover:text-zinc-200 hover:bg-[#1e1e22]'
                    }`}
                  >
                    {filterHasAttachment ? "✓ Has Attachment" : "Any Attachment"}
                  </button>
                </div>

                {/* Read / Unread Status */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400">Read Status</label>
                  <button
                    onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                    className={`flex items-center justify-center h-10 px-4 rounded-xl text-xs font-medium border transition-all ${
                      filterUnreadOnly 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold' 
                        : 'border-zinc-800 bg-[#1e1e22]/50 text-zinc-400 hover:text-zinc-200 hover:bg-[#1e1e22]'
                    }`}
                  >
                    {filterUnreadOnly ? "✉ Unread Only" : "All Messages"}
                  </button>
                </div>

                {/* Date range selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400">Received Date</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="h-10 px-3 rounded-xl text-xs font-medium border border-zinc-800 bg-[#1e1e22]/50 text-zinc-300 focus:ring-1 focus:ring-amber-500/50 cursor-pointer outline-none"
                  >
                    <option value="all" className="bg-[#161618]">Any time</option>
                    <option value="today" className="bg-[#161618]">Last 24 hours</option>
                    <option value="week" className="bg-[#161618]">Last 7 days</option>
                    <option value="month" className="bg-[#161618]">Last 30 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          {/* Realtime connection indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141416] border border-zinc-800/50 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-medium text-zinc-400">{isConnected ? 'Live Sync' : 'Connecting...'}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <select 
              className="bg-[#141416] border border-zinc-800 rounded-full px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 cursor-pointer text-zinc-300 hover:bg-[#1c1c1f] transition-all shadow-sm"
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                fetchHistory(e.target.value);
                setSelectedEmail(null);
                setIsComposing(false);
              }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-[#0c0c0e] text-zinc-300">{acc.account_email}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#0c0c0e]">
        {/* Left Sidebar */}
        <div className="w-64 shrink-0 flex flex-col pr-4 pt-6 pl-6">
          <div className="mb-6">
            <Button 
              onClick={() => { 
                setIsComposing(true); 
                setSelectedEmail(null); 
                setContent(
                  profile?.email_signature 
                    ? `<p><br></p><p><br></p><p>--</p>${profile.email_signature}` 
                    : (profile ? `<p><br></p><p><br></p><p>--</p>${getDefaultSignature(profile)}` : "")
                );
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold tracking-wide shadow-[0_4px_20px_-4px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_24px_-4px_rgba(245,158,11,0.55)] hover:scale-[1.01] active:scale-[0.99] h-12 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm border-t border-white/20"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Compose Mail
            </Button>
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-1">
              {folders.map(folder => {
                const isActive = activeFolder === folder.id && !isComposing && !selectedEmail;
                return (
                  <button
                    key={folder.id}
                    onClick={() => { setActiveFolder(folder.id); setIsComposing(false); setSelectedEmail(null); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-amber-500/10 text-amber-500 font-semibold border-l-[3px] border-amber-500 rounded-l-none pl-3.5" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#141416]/60"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <folder.icon className={`h-4 w-4 ${isActive ? 'text-amber-500' : 'text-zinc-500'}`} />
                      {folder.label}
                    </div>
                    {folder.count !== undefined && folder.count > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-[#141416] text-zinc-500 border border-zinc-800'}`}>{folder.count}</span>
                    )}
                  </button>
                );
              })}
              
              <button className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-[#141416]/40 transition-colors mt-2">
                <ChevronDown className="h-4 w-4" />
                More Folder
              </button>
            </div>
            
            <div className="mt-8 pb-6 border-t border-zinc-800/50 pt-6">
               <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-4">System Labels</h3>
               <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer hover:bg-[#141416]/40 text-zinc-400 hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Work</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer hover:bg-[#141416]/40 text-zinc-400 hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Personal</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer hover:bg-[#141416]/40 text-zinc-400 hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Clients</span>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-auto pb-6 border-t border-zinc-800/50 pt-6">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#141416]/40 transition-colors"
              >
                <SettingsIcon className="h-4 w-4 text-zinc-500" />
                Mail Settings
              </button>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#121214]/90 border border-zinc-800 rounded-t-[2rem] mt-4 mr-4 shadow-2xl overflow-hidden relative">
          {/* Action Bar */}
          <div className="h-14 flex items-center px-6 gap-4 shrink-0 bg-[#161618]/50 backdrop-blur-md sticky top-0 z-10 border-b border-zinc-800/80">
            {selectedEmail || isComposing ? (
               <Button variant="ghost" size="icon" onClick={() => { setSelectedEmail(null); setIsComposing(false); }} className="rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200">
                  <ArrowLeft className="h-4 w-4" />
               </Button>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <Button variant="ghost" size="icon" className="rounded-md h-8 w-8 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200">
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200" 
                  onClick={() => syncEmails(selectedAccount, true)} 
                  disabled={isManualSyncing}
                >
                  <RefreshCw className={`h-4 w-4 ${isManualSyncing ? 'animate-spin text-amber-500' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200">
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <div className="ml-auto text-xs text-zinc-500 font-medium">
                  {filteredEmails.length} messages found
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 bg-transparent">
            {isComposing ? (
              <div className="p-8 max-w-4xl mx-auto w-full">
                <div className="space-y-5 bg-[#18181b]/30 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
                    <div className="flex items-center border-b border-zinc-800/80 pb-3">
                      <span className="text-zinc-500 w-16 text-sm font-semibold">To</span>
                      <Input className="border-0 focus-visible:ring-0 shadow-none text-sm px-0 bg-transparent text-zinc-200" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <div className="flex items-center border-b border-zinc-800/80 pb-3">
                      <span className="text-zinc-500 w-16 text-sm font-semibold">Subject</span>
                      <Input className="border-0 focus-visible:ring-0 shadow-none text-sm px-0 font-medium bg-transparent text-zinc-200" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    
                    <div className="pt-2">
                      <ReactQuill theme="snow" value={content} onChange={setContent} className="mb-12 border-none" modules={{ toolbar: [ ['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['link', 'clean'] ] }} />
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4">
                        {attachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[#1c1c1f] px-3 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-300">
                            <FileText className="h-3 w-3 text-zinc-500" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                              <X className="h-3 w-3 hover:text-rose-500 transition-colors" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-6 border-t border-zinc-800/80">
                      <Button 
                        className="rounded-full px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold" 
                        onClick={handleSend} 
                        disabled={sending}
                      >
                        {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Send Message
                      </Button>
                      <div className="flex items-center gap-2">
                        <input type="file" id="mailbox-attach" className="hidden" multiple onChange={handleAttachmentChange} />
                        <Button variant="ghost" size="icon" onClick={() => document.getElementById("mailbox-attach")?.click()} className="rounded-full hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
            ) : selectedEmail ? (
              <div className="p-8 max-w-5xl mx-auto w-full">
                <div className="mb-8 flex items-start justify-between bg-[#18181b]/20 p-6 rounded-2xl border border-zinc-850">
                  <div className="flex-1">
                    <h1 className="text-xl font-medium mb-6 text-zinc-100 flex items-center gap-3">
                      {(() => {
                        const txt = document.createElement("textarea");
                        txt.innerHTML = selectedEmail.subject || "(No Subject)";
                        return txt.value;
                      })()}
                      <Badge variant="outline" className="font-semibold text-[9px] uppercase border-amber-500/30 text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full">{selectedEmail.folder || 'Inbox'}</Badge>
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-semibold text-base shadow-md">
                        {(selectedEmail.from_address || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-200">
                          {selectedEmail.from_address.split('<')[0].trim() || selectedEmail.from_address}
                          <span className="text-xs text-zinc-500 font-normal ml-2">
                            {selectedEmail.from_address.includes('<') ? `<${selectedEmail.from_address.split('<')[1]}` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          to me
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-4 pt-2">
                    {format(new Date(selectedEmail.received_at || selectedEmail.created_at), "MMM d, yyyy, h:mm a")}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleForceFetchEmail(selectedEmail)} title="Reload Message from Server" className="h-8 w-8 rounded-full text-amber-500 hover:text-amber-400 hover:bg-zinc-800/50"><RefreshCw className={`h-4 w-4 ${loadingBody ? 'animate-spin' : ''}`} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"><Star className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"><Reply className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 pl-12 text-sm leading-relaxed text-zinc-300 min-h-[300px]">
                  {loadingBody ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                      <p className="text-xs font-semibold text-zinc-400">Syncing message body from Zoho secure servers...</p>
                    </div>
                  ) : selectedEmail.body_html ? (
                    <div className="email-body-content bg-[#141416]/40 p-8 rounded-2xl border border-zinc-800/80 shadow-inner" dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                  ) : selectedEmail.body_text ? (
                    <div className="font-sans whitespace-pre-wrap bg-[#141416]/40 p-8 rounded-2xl border border-zinc-800/80 shadow-inner text-zinc-300 leading-relaxed">{selectedEmail.body_text}</div>
                  ) : (
                    <span className="italic text-zinc-500">No content available</span>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.attachments &&
                  Array.isArray(selectedEmail.attachments) &&
                  selectedEmail.attachments.length > 0 && (
                  <div className="mt-8 pl-12">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                      Attachments ({selectedEmail.attachments.length})
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedEmail.attachments.map((att: any, i: number) => (
                        <button
                          key={i}
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("email-attachments")
                              .createSignedUrl(att.path, 60);
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, "_blank");
                            }
                          }}
                          className="flex items-center gap-3 bg-[#18181b]/50 hover:bg-[#1e1e22] px-4 py-3 rounded-xl border border-zinc-800 text-sm transition-all cursor-pointer shadow-sm group hover:scale-[1.01]"
                        >
                          <FileText className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <div className="font-semibold text-zinc-300 truncate max-w-[200px]">
                              {att.filename}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                              {att.contentType || "File"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 pl-12 flex gap-3 border-t border-zinc-800/50 pt-8 pb-12">
                   <Button variant="outline" className="rounded-full px-6 bg-transparent border-zinc-850 hover:bg-zinc-800/50 text-zinc-300"><Reply className="h-4 w-4 mr-2" /> Reply</Button>
                   <Button variant="outline" className="rounded-full px-6 bg-transparent border-zinc-850 hover:bg-zinc-800/50 text-zinc-300"><Forward className="h-4 w-4 mr-2" /> Forward</Button>
                   <Button variant="outline" onClick={() => handleForceFetchEmail(selectedEmail)} className="rounded-full px-6 bg-transparent border-amber-500/30 text-amber-500 hover:bg-amber-500/10 ml-auto"><RefreshCw className={`h-4 w-4 mr-2 ${loadingBody ? 'animate-spin' : ''}`} /> Load Missing Attachments</Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {filteredEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                    <div className="relative mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl w-24 h-24 animate-pulse" />
                      <div className="relative p-6 rounded-2xl bg-gradient-to-b from-[#27272a] to-[#18181b] border border-zinc-850 shadow-xl">
                        <Inbox className="h-10 w-10 text-amber-500/80 stroke-[1.5]" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-zinc-200 tracking-tight">
                      {searchQuery ? "No search results" : `Your ${activeFolder} is empty`}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2 max-w-[280px] leading-relaxed font-medium">
                      {searchQuery 
                        ? "We couldn't find any emails matching your keywords." 
                        : `All synchronized emails in this folder will appear here.`}
                    </p>
                  </div>
                ) : (
                  filteredEmails.map((email) => {
                     const txt = document.createElement("textarea");
                     txt.innerHTML = email.subject || "(No Subject)";
                     const subjectText = txt.value;
                     
                     let sender = email.from_address || "";
                     if (sender.includes("<")) {
                        sender = sender.split("<")[0].trim() || sender;
                     }
                     sender = sender.replace(/"/g, '');

                     // Get live status — prefer real-time update over DB value
                     const liveStatus = emailStatuses[email.id] || email.status;
                     const isUnread = !email.is_read;
                     
                     return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`group flex items-center px-6 py-3.5 hover:bg-[#18181b]/30 cursor-pointer transition-all border-b border-zinc-800/40 relative ${
                        isUnread ? 'bg-[#1c1917]/10' : 'bg-transparent'
                      }`}
                    >
                      {/* Left border indicator for unread */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      )}

                      <div className="flex items-center gap-2 w-12 shrink-0 text-zinc-500">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle starred
                          }}
                          className="h-8 w-8 rounded-full hover:bg-zinc-800/40 flex items-center justify-center text-zinc-600 hover:text-amber-500 transition-colors"
                        >
                          <Star className={`h-4 w-4 ${email.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>

                      <div className={`w-44 shrink-0 text-sm truncate pr-4 ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-400 font-medium'}`}>
                        {sender}
                      </div>

                      <div className="flex-1 min-w-0 flex items-center text-sm">
                        <span className={`truncate shrink-0 ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-300 font-medium'}`}>
                           {subjectText}
                        </span>
                        {/* Attachment indicator */}
                        {email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0 && (
                          <Paperclip className="h-3 w-3 text-zinc-500 shrink-0 ml-2" />
                        )}
                        <span className="text-zinc-500 truncate ml-2 text-xs">
                          — {email.body_text ? email.body_text.substring(0, 80) : "No preview available..."}
                        </span>
                      </div>

                      {/* Live status badge + date */}
                      <div className="w-36 shrink-0 text-right text-xs pl-4 flex items-center justify-end gap-2 text-zinc-500 font-semibold">
                        {liveStatus === "sending" && (
                          <span className="flex items-center gap-1 text-blue-400 font-bold">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Sending
                          </span>
                        )}
                        {liveStatus === "pending" && (
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Clock className="h-3 w-3 animate-pulse" />
                            Queued
                          </span>
                        )}
                        {liveStatus === "sent" && (
                          <span className="text-emerald-500 font-bold text-sm">✓</span>
                        )}
                        {liveStatus === "failed" && (
                          <span className="text-rose-500 font-bold text-sm">✗</span>
                        )}
                        <span className={`text-[11px] font-bold ${isUnread ? 'text-amber-500' : 'text-zinc-500'}`}>
                          {format(new Date(email.received_at || email.created_at), "MMM d")}
                        </span>
                      </div>
                    </div>
                  )})
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Mail Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[650px] bg-[#161618] border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-amber-500" />
              Mail Settings
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Configure your personal mail settings and signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Email Signature</label>
              <p className="text-xs text-zinc-500 mb-2">
                This signature will be automatically appended to all outgoing emails.
              </p>
              <div className="bg-[#121214] rounded-xl border border-zinc-800 overflow-hidden">
                <ReactQuill 
                  theme="snow" 
                  value={signatureText} 
                  onChange={setSignatureText} 
                  className="border-none" 
                  modules={{ 
                    toolbar: [ 
                      ['bold', 'italic', 'underline'], 
                      [{'list': 'ordered'}, {'list': 'bullet'}], 
                      ['link', 'clean'] 
                    ] 
                  }} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSettingsOpen(false)}
              className="bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSignature} 
              disabled={savingSignature}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
            >
              {savingSignature ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style dangerouslySetInnerHTML={{__html: `
        .email-body-content * {
            max-width: 100%;
        }
        .email-body-content a {
            color: #f59e0b;
            text-decoration: underline;
        }
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #222225;
            border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #f59e0b/30;
        }
        /* Quill editor dark theme overrides */
        .ql-toolbar.ql-snow {
            border: 1px solid #27272a !important;
            background: #161618 !important;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .ql-container.ql-snow {
            border: 1px solid #27272a !important;
            background: #161618/30 !important;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            font-size: 14px;
        }
        .ql-editor {
            min-height: 250px;
            color: #f4f4f5 !important;
        }
        .ql-editor.ql-blank::before {
            color: #71717a !important;
            font-style: normal;
        }
        .ql-snow .ql-stroke {
            stroke: #a1a1aa !important;
        }
        .ql-snow .ql-fill {
            fill: #a1a1aa !important;
        }
        .ql-snow .ql-picker {
            color: #a1a1aa !important;
        }
        .ql-snow .ql-picker-options {
            background-color: #18181b !important;
            border: 1px solid #27272a !important;
        }
      `}} />
    </div>
  );
}
