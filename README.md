# 🛡️ SafeWord — Family Protection from AI Voice Scams

**A voice can be faked. A family secret can't.**

Scammers can now clone a loved one's voice from a few seconds of a Reel or voice note, then call in a fake emergency — *"I've had an accident, send money now."* In McAfee's global study, **1 in 4 people** had faced an AI voice scam or knew a victim, **77% of victims lost money**, and **India was the worst-hit country (47% exposed, 69% unable to tell a clone from a real voice)**. The FBI logged **$893M in AI-fraud losses in 2025** alone.

The defense recommended by the FBI, FCC and AARP is simple and free: a **family codeword**. Yet only ~13% of families have one — because nobody made it easy. **SafeWord makes it easy.**

🔗 **Try it live:** https://haminyovanantonyfk-netizen.github.io/safe-word/
📱 **Android:** build the APK from the Actions tab (or publish a Release with a `v*` tag to attach it permanently) · **iPhone:** open the live link in Safari → Share → Add to Home Screen.

## What it does

- **🛡️ 4-minute family setup** — a wizard generates a strong family codeword (or use your own), a backup verification question only family can answer, and your family circle with the *saved* phone numbers to call back on.
- **⚖️ The Golden Rule** — no codeword → hang up → call back on the saved number. Never pay on a first call.
- **🎭 Practice drills** — three scripted scam simulations (fake accident call, "digital arrest" officer, lost-phone-abroad message) with scored choices. Families who practise don't panic — and don't pay.
- **🚨 In-call panic flow** — a big red button for the worst moment: the exact words to say, hang-up guidance, one-tap call-back to family, and outcome logging.
- **🔍 Scam-message checker** — paste any WhatsApp message, SMS or email; 13 pattern detectors (digital arrest, OTP theft, fake emergencies, secrecy pressure, UPI/gift-card/crypto demands, job scams, lottery…) produce a 0–100 risk score and clear next steps. Runs entirely on the device.
- **🖨️ Printable family card** — the protocol on paper for the fridge or wallet (codeword excluded by default).
- **🌍 English · हिन्दी · മലയാളം** — full UI, drills and checker in three languages, because the victims are in family WhatsApp groups, not on English Twitter.
- **🆘 If money was sent** — step-by-step: call **1930**, freeze via your bank, report at **cybercrime.gov.in**.

## Privacy

No account. No server. No analytics. Your codeword and family details are stored only in your own browser on your own device, and the app works fully offline. There is nothing to hack because there is nothing to steal — by design.

## Why a codeword beats "AI detectors"

Studies show people identify cloned voices only slightly better than chance, and detection tools lose the arms race. A secret agreed offline can't be cloned, guessed from social media, or talked around: **no word, no trust.**

## Run it yourself

```bash
git clone https://github.com/haminyovanantonyfk-netizen/safe-word
cd safe-word
npx serve .
```

Plain HTML/CSS/JS — no build step. `ci/` contains the GitHub Actions workflows (copy to `.github/workflows/`): GitHub Pages deploy, Android APK (Capacitor), iOS build.

## Honest limits

SafeWord is a protocol and training tool, not a guarantee: it works when families actually agree the rule *before* a scary call arrives, and keep the codeword offline. It cannot block calls or verify voices — that's the point: verification is a question, not an app permission.

## License

MIT — free for everyone, forever. If SafeWord protects one family, it has done its job. Share it with yours.
