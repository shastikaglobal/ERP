import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Send as SendIcon, Paperclip, Loader2, User, History, X, FileText, Plus,
  Inbox, Star, Clock, File as FileIcon, ChevronDown, RefreshCw, MoreVertical,
  CheckSquare, ArrowLeft, Reply, Forward, Search
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Mailbox() {
  const { profile } = useAuth();

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

  // Live status tracking
  const [emailStatuses, setEmailStatuses] = useState<Record<string, string>>({});

  // Realtime connection status
  const [isConnected, setIsConnected] = useState(false);

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
            emailId: email.id
          }
        });
        if (data?.success && data.content) {
          setSelectedEmail((prev: any) => prev?.id === email.id ? { ...prev, body_html: data.content } : prev);
          setSentEmails((prev) => prev.map(e => e.id === email.id ? { ...e, body_html: data.content } : e));
        }
      } catch (err) {
        console.error("Failed to fetch full email body", err);
      } finally {
        setLoadingBody(false);
      }
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
      const { data, error } = await supabase
        .from("zoho_accounts")
        .select("*")
        .eq("user_id", profile?.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data && data.length > 0) {
        setAccounts(data);
        setSelectedAccount(data[0].id);
        await fetchHistory(data[0].id);
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
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setSentEmails(data);
    }
  }

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
                duration: 4000,
                icon: "📨",
              });
            } else if (status === "failed") {
              toast.error(`✗ Failed to send: ${subject}`, {
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
      toast.loading("Sending email...", { id: `sending-${emailRow.id}`, duration: 10000 });
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
    { id: "inbox", label: "Inbox", icon: Inbox, count: sentEmails.filter(e => e.folder === "inbox" || !e.folder).length },
    { id: "starred", label: "Starred", icon: Star },
    { id: "snoozed", label: "Snoozed", icon: Clock },
    { id: "sent", label: "Sent", icon: SendIcon },
    { id: "drafts", label: "Drafts", icon: FileIcon, count: 0 },
  ];

  // Filter emails by search query
  const filteredEmails = sentEmails.filter(email => {
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
    <div className="h-[calc(100vh-6rem)] flex flex-col pt-0 w-full overflow-hidden">
      {/* Top Header / Search */}
      <div className="flex items-center gap-4 py-3 px-6 shrink-0 bg-background border-b">
        <div className="flex items-center gap-3 w-64 shrink-0">
          <Mail className="h-7 w-7 text-primary" />
          <span className="text-2xl font-medium tracking-tight">Mail</span>
        </div>
        
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input 
              placeholder="Search mail" 
              className="pl-12 h-12 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:shadow-md transition-all rounded-full text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          {/* Realtime connection indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
            <span className="hidden md:inline">{isConnected ? 'Live' : 'Connecting...'}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <select 
              className="bg-transparent border border-border rounded-full px-4 py-2 text-sm font-medium focus:ring-1 cursor-pointer text-foreground hover:bg-muted/50 transition-colors"
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                fetchHistory(e.target.value);
                setSelectedEmail(null);
                setIsComposing(false);
              }}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-background">{acc.account_email}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-background">
        {/* Left Sidebar */}
        <div className="w-64 shrink-0 flex flex-col pr-4 pt-4">
          <div className="pl-4 mb-4">
            <Button 
              onClick={() => { setIsComposing(true); setSelectedEmail(null); }}
              className="w-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg h-14 px-6 rounded-2xl shadow transition-all flex items-center gap-3 font-medium text-sm"
            >
              <FileIcon className="h-5 w-5 fill-current opacity-80" />
              Compose
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-0.5">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => { setActiveFolder(folder.id); setIsComposing(false); setSelectedEmail(null); }}
                  className={`w-full flex items-center justify-between px-5 py-2 rounded-r-full text-sm font-medium transition-colors ${
                    activeFolder === folder.id && !isComposing && !selectedEmail
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <folder.icon className="h-4 w-4" />
                    {folder.label}
                  </div>
                  {folder.count !== undefined && folder.count > 0 && (
                    <span className="text-xs font-bold">{folder.count}</span>
                  )}
                </button>
              ))}
              
              <button className="w-full flex items-center gap-4 px-5 py-2 rounded-r-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors mt-2">
                <ChevronDown className="h-4 w-4" />
                More
              </button>
            </div>
            
            <div className="mt-8 px-5 pb-4">
               <h3 className="text-xs font-medium text-foreground mb-3">Labels</h3>
               <div className="space-y-0.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4 px-3 py-2 rounded-r-full cursor-pointer hover:bg-muted"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Work</div>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-r-full cursor-pointer hover:bg-muted"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Personal</div>
                  <div className="flex items-center gap-4 px-3 py-2 rounded-r-full cursor-pointer hover:bg-muted"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Clients</div>
               </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-card rounded-t-3xl mt-4 mr-4 shadow-sm border border-b-0 overflow-hidden">
          {/* Action Bar */}
          <div className="h-12 flex items-center px-4 gap-4 shrink-0 bg-background/95 backdrop-blur sticky top-0 z-10 border-b">
            {selectedEmail || isComposing ? (
               <Button variant="ghost" size="icon" onClick={() => { setSelectedEmail(null); setIsComposing(false); }} className="rounded-full hover:bg-muted">
                  <ArrowLeft className="h-5 w-5" />
               </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-sm h-8 w-8 hover:bg-muted">
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-muted" onClick={() => fetchHistory(selectedAccount)}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 bg-background">
            {isComposing ? (
              <div className="p-6 max-w-4xl mx-auto w-full">
                <div className="space-y-4">
                    <div className="flex items-center border-b pb-2">
                      <span className="text-muted-foreground w-16 text-sm">To</span>
                      <Input className="border-0 focus-visible:ring-0 shadow-none text-sm px-0" placeholder="recipient@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <div className="flex items-center border-b pb-2">
                      <span className="text-muted-foreground w-16 text-sm">Subject</span>
                      <Input className="border-0 focus-visible:ring-0 shadow-none text-sm px-0 font-medium" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    
                    <div className="pt-2">
                      <ReactQuill theme="snow" value={content} onChange={setContent} className="h-[300px] mb-12 border-none" modules={{ toolbar: [ ['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['link', 'clean'] ] }} />
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4">
                        {attachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border text-xs">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                              <X className="h-3 w-3 hover:text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-6 mt-6">
                      <Button className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleSend} disabled={sending}>
                        {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Send
                      </Button>
                      <div className="flex items-center gap-2">
                        <input type="file" id="mailbox-attach" className="hidden" multiple onChange={handleAttachmentChange} />
                        <Button variant="ghost" size="icon" onClick={() => document.getElementById("mailbox-attach")?.click()} className="rounded-full">
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
            ) : selectedEmail ? (
              <div className="p-8 max-w-5xl mx-auto w-full">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-normal mb-6 text-foreground">
                      {(() => {
                        const txt = document.createElement("textarea");
                        txt.innerHTML = selectedEmail.subject || "(No Subject)";
                        return txt.value;
                      })()}
                      <Badge variant="outline" className="ml-3 font-normal text-[10px] uppercase">Inbox</Badge>
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg shadow-sm">
                        {(selectedEmail.from_address || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {selectedEmail.from_address.split('<')[0].trim() || selectedEmail.from_address}
                          <span className="text-xs text-muted-foreground font-normal ml-2">
                            {selectedEmail.from_address.includes('<') ? `<${selectedEmail.from_address.split('<')[1]}` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          to me
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-4 pt-2">
                    {format(new Date(selectedEmail.created_at), "MMM d, yyyy, h:mm a")}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Star className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Reply className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 pl-12 text-sm whitespace-pre-wrap leading-relaxed text-foreground min-h-[400px]">
                  {loadingBody ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p>Loading message...</p>
                    </div>
                  ) : selectedEmail.body_html ? (
                    <div className="email-body-content" dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                  ) : selectedEmail.body_text ? (
                    <div className="font-sans">{selectedEmail.body_text}</div>
                  ) : (
                    <span className="italic text-muted-foreground">No content available</span>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.attachments &&
                  Array.isArray(selectedEmail.attachments) &&
                  selectedEmail.attachments.length > 0 && (
                  <div className="mt-8 pl-12">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
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
                          className="flex items-center gap-2 bg-muted/50 hover:bg-muted px-4 py-3 rounded-xl border text-sm transition-colors cursor-pointer"
                        >
                          <FileText className="h-5 w-5 text-red-500" />
                          <div className="text-left">
                            <div className="font-medium text-foreground truncate max-w-[200px]">
                              {att.filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {att.contentType || "File"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 pl-12 flex gap-3">
                   <Button variant="outline" className="rounded-full px-6 bg-transparent"><Reply className="h-4 w-4 mr-2" /> Reply</Button>
                   <Button variant="outline" className="rounded-full px-6 bg-transparent"><Forward className="h-4 w-4 mr-2" /> Forward</Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredEmails.length === 0 ? (
                  <div className="p-20 text-center text-muted-foreground flex flex-col items-center">
                    <Inbox className="h-16 w-16 mb-6 opacity-20" />
                    <p className="text-lg font-medium">
                      {searchQuery ? "No emails match your search" : "Your inbox is empty"}
                    </p>
                    <p className="text-sm mt-2 opacity-70">
                      {searchQuery ? "Try a different search term" : "New messages will appear here."}
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
                     
                     return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className="group flex items-center px-4 py-2 hover:shadow-[inset_1px_0_0_rgba(255,255,255,0.1),inset_-1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,.3)] hover:bg-muted/40 cursor-pointer bg-background transition-all border-b border-transparent"
                    >
                      <div className="flex items-center gap-1 w-16 shrink-0 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted opacity-60 group-hover:opacity-100 p-0" onClick={(e) => e.stopPropagation()}>
                          <div className="w-3.5 h-3.5 border-2 rounded-[2px]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted opacity-60 group-hover:opacity-100 p-0" onClick={(e) => e.stopPropagation()}>
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="w-48 shrink-0 font-bold text-[13px] truncate pr-4 text-foreground/90">
                        {sender}
                      </div>

                      <div className="flex-1 min-w-0 flex items-center text-[13px]">
                        <span className="font-bold truncate shrink-0 text-foreground">
                           {subjectText}
                        </span>
                        {/* Attachment indicator */}
                        {email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0 && (
                          <Paperclip className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                        )}
                        <span className="text-muted-foreground truncate ml-2">
                          - {email.body_text ? email.body_text.substring(0, 100) : "No preview available..."}
                        </span>
                      </div>

                      {/* Live status badge + date */}
                      <div className="w-36 shrink-0 text-right text-xs pl-4 flex items-center justify-end gap-2">
                        {liveStatus === "sending" && (
                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Sending
                          </span>
                        )}
                        {liveStatus === "pending" && (
                          <span className="flex items-center gap-1 text-yellow-400 font-medium">
                            <Clock className="h-3 w-3" />
                            Queued
                          </span>
                        )}
                        {liveStatus === "sent" && (
                          <span className="text-green-500 font-bold text-base">✓</span>
                        )}
                        {liveStatus === "failed" && (
                          <span className="text-red-500 font-bold">✗</span>
                        )}
                        <span className="font-bold text-foreground/90">
                          {format(new Date(email.created_at), "MMM d")}
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
      
      <style dangerouslySetInnerHTML={{__html: `
        .email-body-content * {
            max-width: 100%;
        }
        .email-body-content a {
            color: #3b82f6;
            text-decoration: underline;
        }
      `}} />
    </div>
  );
}
