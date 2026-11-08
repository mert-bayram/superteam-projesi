import { useState, type FormEvent, type MouseEvent } from "react";
import { AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Heart,
  LoaderCircle,
  MessageCircle,
  Play,
  Plus,
  Send,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import idl from "./idl/superteam_projesi.json";

type Panel = "tip" | "profile" | null;

const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID || idl.address);
const creatorName = "mertbuilds";
const creatorImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=85";

const posts = [
  {
    id: "studio-night",
    category: "STÜDYO NOTLARI",
    title: "Bir fikrin gece yarısı sese dönüşmesi.",
    caption: "Bu gece yeni setin ilk parçalarını kaydediyorum. Kulaklıkları tak, biraz içeride kal.",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=88",
    likes: 1842,
    comments: 38,
    time: "00:18",
    accent: "#d8fb65",
  },
  {
    id: "sound-check",
    category: "CANLI KAYIT",
    title: "Soundcheck'ten küçük bir kesit.",
    caption: "Işıklar açılmadan hemen önce. Burada olmanız bütün farkı yaratıyor.",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=88",
    likes: 962,
    comments: 21,
    time: "00:24",
    accent: "#ff796b",
  },
  {
    id: "after-hours",
    category: "ÜRETİM MASASI",
    title: "Bir sonraki yayının hazırlığı.",
    caption: "Kablo karmaşası, açık sekmeler ve sonunda çalışan bir fikir. Devamı yakında.",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=88",
    likes: 2310,
    comments: 64,
    time: "00:31",
    accent: "#8fe0ce",
  },
];

function parseSolAmount(value: string): BN | null {
  const match = value.trim().match(/^(\d+)(?:\.(\d{0,9}))?$/);
  if (!match) return null;

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] || "").padEnd(9, "0") || "0");
  const lamports = whole * BigInt(LAMPORTS_PER_SOL) + fraction;
  return lamports > 0n ? new BN(lamports.toString()) : null;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { setVisible } = useWalletModal();
  const [panel, setPanel] = useState<Panel>(null);
  const [recipient, setRecipient] = useState(import.meta.env.VITE_STREAMER_ADDRESS || "");
  const [amount, setAmount] = useState("0.05");
  const [message, setMessage] = useState("");
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [copied, setCopied] = useState(false);

  const openTip = () => {
    setError("");
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }
    setPanel("tip");
  };

  const closePanel = () => {
    if (isSending) return;
    setPanel(null);
    setError("");
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    );
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closePanel();
  };

  const handleTip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSignature("");

    if (!anchorWallet || !wallet.publicKey) {
      setVisible(true);
      return;
    }

    const lamports = parseSolAmount(amount);
    if (!lamports) {
      setError("0'dan büyük, en fazla 9 ondalık basamaklı bir SOL miktarı gir.");
      return;
    }
    if (new TextEncoder().encode(message).length > 140) {
      setError("Mesaj 140 byte sınırını aşamaz.");
      return;
    }

    let streamer: PublicKey;
    try {
      streamer = new PublicKey(recipient.trim());
    } catch {
      setError("Geçerli bir yayıncı Solana cüzdan adresi gir.");
      return;
    }
    if (streamer.equals(wallet.publicKey)) {
      setError("Kendi cüzdanına bağış gönderemezsin.");
      return;
    }

    setIsSending(true);
    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
      const program = new Program(idl as unknown as Idl, provider);
      const tipId = new BN(
        (BigInt(Date.now()) * 1_000n + BigInt(Math.floor(Math.random() * 1_000))).toString(),
      );
      const [tipRecord] = PublicKey.findProgramAddressSync(
        [
          new TextEncoder().encode("tip"),
          wallet.publicKey.toBytes(),
          Uint8Array.from(tipId.toArray("le", 8)),
        ],
        programId,
      );

      const txSignature = await program.methods
        .sendTip(tipId, lamports, message.trim() || null)
        .accounts({
          donor: wallet.publicKey,
          streamer,
          tipRecord,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setSignature(txSignature);
      setMessage("");
      setPanel(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı.");
    } finally {
      setIsSending(false);
    }
  };

  const copyAddress = async () => {
    if (!recipient) return;
    await navigator.clipboard.writeText(recipient);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Akış ana sayfa">
          <span className="wordmark-mark"><Play size={13} fill="currentColor" /></span>
          <span>akış<span className="wordmark-period">.</span></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> YAYINCI AKIŞI <span className="network-tag">DEVNET</span></div>
        <button
          className={`wallet-button${wallet.publicKey ? " wallet-button-connected" : ""}`}
          onClick={() => wallet.publicKey ? void wallet.disconnect() : setVisible(true)}
          type="button"
        >
          <Wallet size={15} strokeWidth={2.2} />
          <span>{wallet.publicKey ? shortAddress(wallet.publicKey.toBase58()) : "Cüzdanı bağla"}</span>
        </button>
      </header>

      <nav className="side-nav" aria-label="Ana gezinme">
        <a className="side-nav-item active" href="#top" aria-label="Akış" title="Akış"><Play size={18} fill="currentColor" /></a>
        <button className="side-nav-item" type="button" aria-label="Mesajlar" title="Mesajlar"><MessageCircle size={19} /></button>
        <button className="side-nav-item" type="button" aria-label="Daha fazla" title="Daha fazla"><Plus size={20} /></button>
      </nav>

      <section className="feed" id="top" aria-label="Dikey yayın akışı">
        {posts.map((post, index) => {
          const isLiked = likedPosts.includes(post.id);
          return (
            <article className="reel" key={post.id}>
              <img className="reel-image" src={post.image} alt="Yayıncının stüdyo ve sahne görüntüsü" />
              <div className="reel-shade" />
              <div className="reel-grain" />
              <div className="reel-content">
                <div className="reel-meta"><span className="category-mark" style={{ backgroundColor: post.accent }} />{post.category}<span className="meta-divider">/</span>{post.time}</div>
                <h1>{post.title}</h1>
                <p className="reel-caption">{post.caption}</p>
                <div className="creator-line">
                  <img src={creatorImage} alt="" />
                  <div><strong>@{creatorName}</strong><span>Bağımsız üretici · İstanbul</span></div>
                  <button className="follow-button" type="button" onClick={() => setPanel("profile")}>Takip et <Plus size={13} /></button>
                </div>
              </div>
              <aside className="action-rail" aria-label="Yayın eylemleri">
                <button className="rail-button profile-action" onClick={() => setPanel("profile")} type="button" aria-label="Yayıncı profili" title="Yayıncı profili">
                  <span className="avatar-wrap"><img src={creatorImage} alt="" /><span className="avatar-plus"><Plus size={11} /></span></span>
                </button>
                <button className={`rail-button${isLiked ? " liked" : ""}`} onClick={() => toggleLike(post.id)} type="button" aria-label={isLiked ? "Beğeniyi kaldır" : "Beğen"} title="Beğen">
                  <Heart size={25} fill={isLiked ? "currentColor" : "none"} />
                  <span>{(post.likes + (isLiked ? 1 : 0)).toLocaleString("tr-TR")}</span>
                </button>
                <button className="rail-button" type="button" aria-label="Yorumlar" title="Yorumlar">
                  <MessageCircle size={24} />
                  <span>{post.comments}</span>
                </button>
                <button className="tip-action" onClick={openTip} type="button" aria-label="Bağış yap" title="Bağış yap">
                  <span className="tip-action-icon"><Sparkles size={20} /></span>
                  <span>Bağış<br />yap</span>
                </button>
              </aside>
              <div className="reel-index"><span>0{index + 1}</span><span className="index-rule" /><span>0{posts.length}</span></div>
            </article>
          );
        })}
      </section>

      <div className="scroll-hint"><ArrowDown size={14} /> KAYDIR</div>

      {signature && (
        <div className="transaction-toast" role="status">
          <span className="toast-check"><Check size={16} /></span>
          <div><strong>Bağış zincire kaydedildi</strong><a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer">İşlemi görüntüle <ArrowUpRight size={13} /></a></div>
          <button type="button" onClick={() => setSignature("")} aria-label="Bildirimi kapat"><X size={15} /></button>
        </div>
      )}

      {panel && (
        <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
          {panel === "tip" ? (
            <section className="tip-sheet" role="dialog" aria-modal="true" aria-labelledby="tip-title">
              <button className="modal-close" onClick={closePanel} type="button" aria-label="Kapat"><X size={19} /></button>
              <div className="sheet-kicker"><span className="live-dot" /> DOĞRUDAN DESTEK</div>
              <div className="sheet-heading">
                <img src={creatorImage} alt="" />
                <div><h2 id="tip-title">Yayıncıya destek ol</h2><p>@{creatorName} için SOL bağışı</p></div>
              </div>
              <form onSubmit={handleTip}>
                <label className="field-label" htmlFor="recipient">Yayıncı cüzdan adresi</label>
                <div className="address-field">
                  <input id="recipient" autoComplete="off" spellCheck={false} value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Solana cüzdan adresini gir" />
                  {recipient && <button type="button" onClick={() => void copyAddress()} aria-label="Adresi kopyala" title="Adresi kopyala">{copied ? <Check size={16} /> : <Plus size={16} />}</button>}
                </div>
                {!recipient && <p className="field-note">Gerçek yayıncı cüzdanını gir. Adres ayarı .env dosyasından da yapılabilir.</p>}

                <label className="field-label amount-label" htmlFor="amount">Bağış miktarı <span>SOL</span></label>
                <div className="amount-options">
                  {["0.01", "0.05", "0.1", "0.5"].map((value) => (
                    <button className={amount === value ? "selected" : ""} key={value} onClick={() => setAmount(value)} type="button">{value}<span>◎</span></button>
                  ))}
                </div>
                <div className="amount-input-wrap"><input id="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label="SOL miktarı" /><span>SOL</span></div>

                <label className="field-label message-label" htmlFor="message">Mesaj <span>İSTEĞE BAĞLI · {new TextEncoder().encode(message).length}/140 BYTE</span></label>
                <textarea id="message" rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Yayıncıya kısa bir not bırak..." />

                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="submit-tip" type="submit" disabled={isSending || !wallet.publicKey || !recipient.trim()}>
                  {isSending ? <><LoaderCircle className="spin" size={17} /> Phantom'da onay bekleniyor</> : <><Send size={16} />{wallet.publicKey ? "Phantom ile bağış yap" : "Önce cüzdanı bağla"}<ArrowUpRight size={15} /></>}
                </button>
                <p className="security-note"><span /> İşlem Phantom'da onaylanır. Ağ: Solana Devnet.</p>
              </form>
            </section>
          ) : (
            <section className="profile-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-title">
              <button className="modal-close" onClick={closePanel} type="button" aria-label="Kapat"><X size={19} /></button>
              <div className="profile-banner"><Sparkles size={20} /><span>INDEPENDENT CREATOR</span></div>
              <img className="profile-large-avatar" src={creatorImage} alt="" />
              <h2 id="profile-title">@{creatorName}</h2>
              <p className="profile-bio">Ses, görüntü ve internetin kesiştiği yerde üretim. Bu akış bağımsız içerik üretimini doğrudan destekler.</p>
              <div className="profile-stats"><div><strong>12.8K</strong><span>takipçi</span></div><div><strong>84</strong><span>yayın</span></div><div><strong>İstanbul</strong><span>konum</span></div></div>
              <div className="profile-wallet"><span>BAĞIŞ CÜZDANI</span><strong>{recipient ? shortAddress(recipient) : "Henüz ayarlanmadı"}</strong></div>
              <button className="submit-tip profile-tip" type="button" onClick={() => { if (!wallet.publicKey) setVisible(true); else setPanel("tip"); }}><Send size={16} /> Bağış yap</button>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
