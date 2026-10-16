import React, { useRef, useState } from 'react';

const sampleReceipt = {
  fileName: '',
  currency: 'USD',
  items: [
    { name: 'Crispy cauliflower', price: 9.5 },
    { name: 'Margherita pizza', price: 16 },
    { name: 'Truffle fries', price: 8.5 },
    { name: 'Iced matcha', price: 6 },
  ],
  tax: 3.2,
  tip: 6,
};

const initialFriends = [
  { id: 1, name: 'You' },
  { id: 2, name: 'Alex' },
  { id: 3, name: 'Sam' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatCurrency(amount) {
  return money.format(amount);
}

function calculateTotal(receipt) {
  const itemsTotal = receipt.items.reduce((sum, item) => sum + item.price, 0);
  return Number((itemsTotal + receipt.tax + receipt.tip).toFixed(2));
}

function splitAmount(amount, numberOfPeople) {
  const totalCents = Math.round(amount * 100);
  const baseShare = Math.floor(totalCents / numberOfPeople);
  const remainder = totalCents % numberOfPeople;

  return Array.from({ length: numberOfPeople }, (_, index) =>
    (baseShare + (index < remainder ? 1 : 0)) / 100,
  );
}

function App() {
  const fileInputRef = useRef(null);
  const friendIdRef = useRef(initialFriends.length + 1);
  const [receipt, setReceipt] = useState(sampleReceipt);
  const [selectedFile, setSelectedFile] = useState(null);
  const [friends, setFriends] = useState(initialFriends);
  const [friendName, setFriendName] = useState('');
  const [status, setStatus] = useState('sample');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const total = calculateTotal(receipt);
  const shares = splitAmount(total, friends.length);
  const itemsTotal = receipt.items.reduce((sum, item) => sum + item.price, 0);

  function chooseFile(file) {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
    const hasAcceptedType = ACCEPTED_FILE_TYPES.includes(file.type);
    if (!hasAcceptedExtension && !hasAcceptedType) {
      setSelectedFile(null);
      setError('Choose a PDF, JPG, PNG, or WEBP receipt.');
      setStatus('error');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError('This file is over 10MB. Please choose a smaller receipt.');
      setStatus('error');
      return;
    }

    setSelectedFile(file);
    setReceipt({ ...sampleReceipt, fileName: file.name });
    setError('');
    setStatus('ready');
  }

  async function handleReceiptUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Choose a receipt PDF or image first.');
      setStatus('error');
      return;
    }

    setError('');
    setStatus('processing');

    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const response = await fetch('/api/receipt', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'The receipt could not be processed.');
      }

      setReceipt(result);
      setStatus('success');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The receipt could not be processed.');
      setStatus('error');
    }
  }

  function handleFileChange(event) {
    chooseFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  function addFriend(event) {
    event.preventDefault();
    const name = friendName.trim();
    if (!name) return;

    setFriends((currentFriends) => [
      ...currentFriends,
      { id: friendIdRef.current++, name },
    ]);
    setFriendName('');
  }

  function removeFriend(id) {
    if (friends.length <= 1) return;
    setFriends((currentFriends) => currentFriends.filter((friend) => friend.id !== id));
  }

  function resetSample() {
    setSelectedFile(null);
    setReceipt(sampleReceipt);
    setFriends(initialFriends);
    setError('');
    setStatus('sample');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand-wrap" href="#" aria-label="Split the check home">
          <span className="brand-mark">✳</span>
          <span className="brand-copy">
            <span className="brand-name">split the check</span>
            <span className="brand-sub">good food, fair shares</span>
          </span>
        </a>

        <nav className="nav" aria-label="Main navigation">
          <a href="#receipt">Receipt</a>
          <a href="#items">Your items</a>
          <a href="#friends">Split with friends</a>
        </nav>

        <a className="ghost-button" href="#receipt">Split a bill</a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Less math, more dessert</span>
            <h1>Good food is better when the bill is easy.</h1>
            <p>
              Upload a restaurant receipt, check the items, add your friends,
              and see everyone&apos;s share in seconds.
            </p>
            <a className="primary-button" href="#receipt">Split your bill <span aria-hidden="true">↘</span></a>
            <div className="hero-note"><span className="hero-note-dot" /> Your receipt is only used for this preview and isn&apos;t stored.</div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="plate plate-back" />
            <div className="plate">
              <div className="plate-food">🍕</div>
            </div>
            <div className="art-sparkle sparkle-one">✳</div>
            <div className="art-sparkle sparkle-two">✳</div>
            <div className="floating-note">good times<br /><strong>÷ everyone</strong></div>
          </div>
        </section>

        <section className="workspace" id="receipt">
          <div className="section-title">
            <div>
              <span className="eyebrow">The easy part</span>
              <h2>Let&apos;s split this check.</h2>
            </div>
            <button className="text-button" type="button" onClick={resetSample}>Reset sample</button>
          </div>

          <form className="receipt-form" onSubmit={handleReceiptUpload}>
            <div
              className={`upload-box${isDragging ? ' is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
              }}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                className="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                aria-label="Choose a receipt PDF or image"
              />
              <span className="upload-icon" aria-hidden="true">↥</span>
              <div className="upload-copy">
                <strong>{selectedFile?.name || 'Drop your receipt here'}</strong>
                <span
                  className={status === 'error' ? 'error-text' : undefined}
                  role={status === 'error' ? 'alert' : undefined}
                >
                  {status === 'processing'
                    ? 'Adding sample items…'
                    : status === 'success'
                      ? 'Sample items added — AI extraction comes later.'
                      : status === 'error'
                        ? error
                        : selectedFile
                          ? 'Receipt ready · PDF or image · 10MB max'
                          : 'PDF, JPG, PNG, or WEBP · up to 10MB'}
                </span>
              </div>
              <button
                className="browse-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </button>
            </div>
            <button className="primary-button upload-button" type="submit" disabled={!selectedFile || status === 'processing'}>
              {status === 'processing' ? 'Reading receipt…' : 'Add receipt items'}
            </button>
          </form>
          <p className="demo-notice">Demo mode · uploaded receipt is not saved. The item list below uses mock data.</p>

          <div className="bill-grid">
            <section className="receipt-card" id="items" aria-labelledby="items-heading">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">The damage (not really)</span>
                  <h3 id="items-heading">{receipt.fileName || 'Saturday dinner'}</h3>
                </div>
                <span className="receipt-stamp">MOCK DATA</span>
              </div>

              <div className="item-table">
                <div className="table-header"><span>Item</span><span>Price</span></div>
                {receipt.items.map((item, index) => (
                  <div className="item-row" key={`${item.name}-${index}`}>
                    <span><i>{String(index + 1).padStart(2, '0')}</i>{item.name}</span>
                    <strong>{formatCurrency(item.price)}</strong>
                  </div>
                ))}
              </div>

              <div className="receipt-totals">
                <div><span>Food &amp; drinks</span><span>{formatCurrency(itemsTotal)}</span></div>
                <div><span>Tax</span><span>{formatCurrency(receipt.tax)}</span></div>
                <div><span>Tip</span><span>{formatCurrency(receipt.tip)}</span></div>
                <div className="bill-total"><strong>Total bill</strong><strong>{formatCurrency(total)}</strong></div>
              </div>
            </section>

            <section className="split-card" id="friends" aria-labelledby="friends-heading">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">Your crew</span>
                  <h3 id="friends-heading">Who&apos;s in?</h3>
                </div>
                <span className="people-count">{friends.length} {friends.length === 1 ? 'person' : 'people'}</span>
              </div>

              <form className="add-friend-form" onSubmit={addFriend}>
                <label className="sr-only" htmlFor="friendName">Friend&apos;s name</label>
                <input
                  id="friendName"
                  value={friendName}
                  onChange={(event) => setFriendName(event.target.value)}
                  placeholder="Add a friend"
                  maxLength={32}
                />
                <button type="submit" aria-label="Add friend" disabled={!friendName.trim()}>+</button>
              </form>

              <ul className="friend-list">
                {friends.map((friend, index) => (
                  <li key={friend.id}>
                    <span className={`avatar avatar-${index % 4}`}>{friend.name.trim().charAt(0).toUpperCase()}</span>
                    <span className="friend-name">{friend.name}</span>
                    <strong className="friend-share">{formatCurrency(shares[index])}</strong>
                    {friends.length > 1 && (
                      <button
                        className="remove-friend"
                        type="button"
                        onClick={() => removeFriend(friend.id)}
                        aria-label={`Remove ${friend.name}`}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="split-summary">
                <span>Split evenly between {friends.length}</span>
                <strong>{formatCurrency(total / friends.length)} <small>each*</small></strong>
                <p>*Any extra cent is assigned to the first share so the amounts always add up to the total.</p>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand-wrap" href="#" aria-label="Split the check home">
          <span className="brand-mark">✳</span>
          <span className="brand-copy">
            <span className="brand-name">split the check</span>
            <span className="brand-sub">good food, fair shares</span>
          </span>
        </a>
        <span>Made for the “I&apos;ll just Venmo you” moment.</span>
      </footer>
    </div>
  );
}

export default App;
