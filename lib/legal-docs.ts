import type { LegalDocumentConfig, LegalDocumentId } from "@/lib/legal-shared";

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocumentConfig> = {
  terms: {
    id: "terms",
    title: "Terms of Service",
    lastUpdatedLabel: "September 29, 2026",
    intro:
      'These Terms of Service ("Terms") are an agreement between you and LCB Training LLC ("LCB Training," "we," "us"), operated by Chris Broccolino ("Coach Broc"). They cover lcbtraining.com, the LCB Training app, and all coaching services we offer (together, the "Services"). By creating an account, buying anything, or using the Services, you agree to these Terms, our Privacy Policy, and our Assumption of Risk and Release of Liability ("Waiver").',
    blocks: [
      {
        type: "heading",
        text: "1. Who can use the Services",
      },
      {
        type: "bullets",
        items: [
          "You must be 18 or older, or a parent or legal guardian acting for a player.",
          "Players under 18 may use the Services only with the permission of a parent or legal guardian, who agrees to these Terms for them.",
          "Players under 13 must have their account created and managed by a parent or legal guardian. We do not knowingly collect information from a child under 13 without a parent's consent.",
          'When "you" is used in these Terms, it means both the player and the parent or guardian who agreed for them.',
        ],
      },
      {
        type: "heading",
        text: "2. Your account",
      },
      {
        type: "bullets",
        items: [
          "Give accurate information and keep it up to date.",
          "Keep your login private. You are responsible for activity on your account.",
          "One account per player. Do not share your account or program access with other players.",
        ],
      },
      {
        type: "heading",
        text: "3. What we offer",
      },
      {
        type: "bullets",
        items: [
          "In-person lessons in the Chicagoland area (Palatine facility or local fields), for individuals and small groups.",
          "Twelve Week Coaching Program: a personalized daily training plan in the app, weekly video feedback from Coach Broc, game and practice logging, messaging, and access to the drill library, The Playbook, and the College Baseball Recruiting Guide for the length of the program.",
          "The Playbook: a digital mindset and training guide with drill library access.",
          "Remote Sessions: live online coaching sessions.",
          "Free submission: one free swing analysis or mental game submission with personal feedback.",
        ],
      },
      {
        type: "paragraph",
        text: "We may add, change, or stop features at any time. If we make a change that removes a major part of a program you paid for while it is active, we will offer a fair fix, like a partial refund or extended access.",
      },
      {
        type: "heading",
        text: "4. Payments",
      },
      {
        type: "bullets",
        items: [
          "Prices are shown at checkout or given to you directly by Coach Broc. All prices are in US dollars.",
          "Online payments are processed by Stripe. We never see or store your full card number.",
          "In-person lessons and lesson packages may be paid directly to Coach Broc by any method he accepts.",
        ],
      },
      {
        type: "heading",
        text: "5. Refunds and cancellations",
      },
      {
        type: "heading",
        text: "Twelve Week Coaching Program",
      },
      {
        type: "bullets",
        items: [
          "Within 14 days of purchase: full refund if no videos have been submitted. If videos have been submitted, the refund is the purchase price minus $60 for each video breakdown already provided.",
          "After 14 days: no refunds.",
        ],
      },
      {
        type: "heading",
        text: "The Playbook",
      },
      {
        type: "paragraph",
        text: "because it is delivered instantly as digital content, all sales are final.",
      },
      {
        type: "heading",
        text: "Remote Sessions",
      },
      {
        type: "paragraph",
        text: "please give at least 24 hours notice to reschedule. Sessions missed without notice may not be refunded.",
      },
      {
        type: "heading",
        text: "In-person lessons",
      },
      {
        type: "bullets",
        items: [
          "Please give at least 24 hours notice if you need to cancel or reschedule. Reschedules are always free.",
          "Repeated no-shows or last-minute cancellations may be charged.",
          "If Coach Broc has to cancel (weather, illness, facility issues), the lesson is rescheduled at no cost.",
          "Unused lessons in a prepaid package may be refunded on request at the per-lesson package rate.",
        ],
      },
      {
        type: "paragraph",
        text: "To ask for a refund, email chrisbroc05@gmail.com.",
      },
      {
        type: "heading",
        text: "6. Program length and access",
      },
      {
        type: "bullets",
        items: [
          "The Twelve Week Coaching Program runs for 12 weeks (84 days) from the start date chosen at setup.",
          "When the program ends, program features such as the daily plan, weekly video feedback, and messaging end. You keep your account and can view your history.",
          "Coach Broc aims to respond to weekly videos during the following week and to messages within about 24 hours, but response times are goals, not guarantees.",
        ],
      },
      {
        type: "heading",
        text: "7. How to use the Services",
      },
      {
        type: "paragraph",
        text: "You agree not to:",
      },
      {
        type: "bullets",
        items: [
          "Share, resell, copy, or post our drills, workouts, videos, The Playbook, or other content outside your own training.",
          "Upload anything that is not yours to share, or that is inappropriate, harassing, or unlawful.",
          "Use messaging for anything other than baseball training and program questions.",
          "Try to break, overload, or get around the security of the Services.",
        ],
      },
      {
        type: "paragraph",
        text: "We may suspend or close accounts that break these rules. If we close a paid account for a serious violation, we are not required to give a refund.",
      },
      {
        type: "heading",
        text: "8. Messaging",
      },
      {
        type: "bullets",
        items: [
          "Messaging is for 12-week players and Coach Broc only, about training and the program.",
          "Messages are kept as a permanent record and cannot be deleted.",
          "A player's parent or second email contact can view the message history.",
        ],
      },
      {
        type: "heading",
        text: "9. Your videos and content",
      },
      {
        type: "bullets",
        items: [
          "You own the videos, notes, and other content you submit.",
          "You give LCB Training permission to store, view, and review your content to provide coaching to you.",
          "We will only use your videos or name on social media, our website, or in marketing if you opt in through the media consent setting. You can turn it off anytime in Settings. Turning it off stops future use; it does not remove posts that are already published, but you can ask us to take specific posts down.",
        ],
      },
      {
        type: "heading",
        text: "10. Our content",
      },
      {
        type: "paragraph",
        text: "All drills, workouts, videos, programs, The Playbook, the College Baseball Recruiting Guide, the LCB Training name, and logos belong to LCB Training LLC. You get a personal, non-transferable right to use them for your own training while you have access.",
      },
      {
        type: "heading",
        text: "11. Health and safety",
      },
      {
        type: "paragraph",
        text: "Baseball and physical training carry a risk of injury. Using the Services requires agreeing to our Waiver. Nothing in the Services is medical advice. Talk to a doctor before starting any training program, and stop and get help if something hurts.",
      },
      {
        type: "heading",
        text: "12. No guaranteed results",
      },
      {
        type: "paragraph",
        text: "We do not guarantee any result, including improved stats, making a team, playing time, college recruitment, or scholarships. Results depend on the player's effort and many things outside our control.",
      },
      {
        type: "heading",
        text: "13. Limitation of liability",
      },
      {
        type: "paragraph",
        text: "To the fullest extent allowed by law, LCB Training LLC and Coach Broc are not liable for indirect, incidental, or consequential damages. Our total liability for any claim related to the Services is limited to the amount you paid us in the 12 months before the claim. Some places do not allow these limits, so they may not fully apply to you.",
      },
      {
        type: "heading",
        text: "14. Changes to these Terms",
      },
      {
        type: "paragraph",
        text: "We may update these Terms. If we make important changes, we will tell you by email or in the app, and you may be asked to agree again. Continuing to use the Services after an update means you accept it.",
      },
      {
        type: "heading",
        text: "15. Governing law",
      },
      {
        type: "paragraph",
        text: "These Terms are governed by the laws of the State of Illinois. Any dispute will be handled in the state or federal courts located in Cook County, Illinois.",
      },
      {
        type: "heading",
        text: "16. Contact",
      },
      {
        type: "paragraph",
        text: "LCB Training LLC",
      },
      {
        type: "paragraph",
        text: "Chris Broccolino",
      },
      {
        type: "paragraph",
        text: "chrisbroc05@gmail.com",
      },
      {
        type: "paragraph",
        text: "847-208-9661",
      },
    ],
  },
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    lastUpdatedLabel: "September 29, 2026",
    intro:
      'This Privacy Policy explains what information LCB Training LLC ("LCB Training," "we," "us") collects through lcbtraining.com and the LCB Training app, how we use it, and your choices. We will never sell your information.',
    blocks: [
      {
        type: "heading",
        text: "1. Information we collect",
      },
      {
        type: "paragraph",
        text: "Account information: name, email, password (stored encrypted), and account type.",
      },
      {
        type: "paragraph",
        text: 'Player information you give us at setup or later: age group, position, focus areas, equipment available, season status, and goals (such as "What do you want to be known for?").',
      },
      {
        type: "paragraph",
        text: "Parent or second email contact: name and email, if added.",
      },
      {
        type: "paragraph",
        text: "Training activity: completed tasks, notes, answers to prompts, game and practice logs, and stats.",
      },
      {
        type: "paragraph",
        text: "Videos and submissions: swing, fielding, and mental game videos and the notes you send with them.",
      },
      {
        type: "paragraph",
        text: "Messages between 12-week players and Coach Broc.",
      },
      {
        type: "paragraph",
        text: "Payment information: handled by Stripe. We receive a record of the purchase (what was bought, amount, date) but never your full card number.",
      },
      {
        type: "paragraph",
        text: "Device and notification information: if you turn on push notifications, we store a notification token for your device. We also keep basic technical data like login sessions.",
      },
      {
        type: "heading",
        text: "2. How we use it",
      },
      {
        type: "bullets",
        items: [
          "To run your account and deliver coaching, including your daily plan, video feedback, and messages.",
          "To send emails and push notifications about your training, like reminders, responses, and weekly recaps.",
          "To send occasional emails about our programs and offers. You can unsubscribe from these anytime.",
          "To process payments and keep records.",
          "To keep the Services secure and working.",
          "To improve our coaching and the app.",
        ],
      },
      {
        type: "heading",
        text: "3. Who we share it with",
      },
      {
        type: "paragraph",
        text: "We share information only with services that help us run LCB Training, and only what they need:",
      },
      {
        type: "bullets",
        items: [
          "Stripe for payments",
          "Render for hosting the website and database",
          "Cloudflare for storing videos and files",
          "Google for sending email",
          "Vimeo for hosting drill library videos",
          "Push notification services built into your phone or browser (such as Apple and Google) to deliver notifications",
        ],
      },
      {
        type: "paragraph",
        text: "We also share information:",
      },
      {
        type: "bullets",
        items: [
          "With the player's parent or second email contact, who can receive recaps and reminders and view message history.",
          "On social media or our website, only if you opt in through media consent.",
          "When required by law, or to protect the safety of a player or others.",
        ],
      },
      {
        type: "paragraph",
        text: "We do not sell or rent your information, and we do not share it with advertisers.",
      },
      {
        type: "heading",
        text: "4. Children's privacy",
      },
      {
        type: "paragraph",
        text: "Many of our players are under 18, and some are under 13.",
      },
      {
        type: "bullets",
        items: [
          "Accounts for players under 13 must be created by a parent or legal guardian, who consents to our collection and use of the player's information as described here.",
          "We collect only the information needed to coach the player.",
          "We do not collect phone numbers from players under 13.",
          "A parent or guardian can review their child's information, ask us to delete it, or stop further collection at any time by emailing chrisbroc05@gmail.com.",
        ],
      },
      {
        type: "paragraph",
        text: "If we learn we collected information from a child under 13 without a parent's consent, we will delete it.",
      },
      {
        type: "heading",
        text: "5. How long we keep it",
      },
      {
        type: "paragraph",
        text: "We keep your information while your account is active and as needed to provide the Services and keep business records. Messages are kept as a permanent record for safety. You can ask us to delete your account and information at any time; we will do so except where we must keep records by law, such as payment records.",
      },
      {
        type: "heading",
        text: "6. Your choices",
      },
      {
        type: "bullets",
        items: [
          "Update your information in Settings.",
          "Turn push notifications on or off in Settings or your phone's settings.",
          "Unsubscribe from marketing emails with the link in any marketing email.",
          "Turn media consent on or off in Settings.",
          "Ask for a copy of your information or for it to be deleted by emailing chrisbroc05@gmail.com.",
        ],
      },
      {
        type: "heading",
        text: "7. Security",
      },
      {
        type: "paragraph",
        text: "We use reasonable measures to protect your information, including encrypted connections, encrypted passwords, and private video storage with time-limited access links. No system is perfectly secure, so we cannot guarantee absolute security.",
      },
      {
        type: "heading",
        text: "8. Changes to this policy",
      },
      {
        type: "paragraph",
        text: "If we make important changes, we will tell you by email or in the app.",
      },
      {
        type: "heading",
        text: "9. Contact",
      },
      {
        type: "paragraph",
        text: "LCB Training LLC",
      },
      {
        type: "paragraph",
        text: "Chris Broccolino",
      },
      {
        type: "paragraph",
        text: "chrisbroc05@gmail.com",
      },
      {
        type: "paragraph",
        text: "847-208-9661",
      },
    ],
  },
  waiver: {
    id: "waiver",
    title: "Assumption of Risk and Release of Liability (Waiver)",
    lastUpdatedLabel: "September 29, 2026",
    intro:
      "Please read carefully. This is a legal document. It affects your legal rights.",
    blocks: [
      {
        type: "paragraph",
        text: 'This Waiver is between LCB Training LLC and its owner, coach, and anyone working on its behalf (together, "LCB Training"), and the participant and, if the participant is under 18, the participant\'s parent or legal guardian (together, "I" or "me").',
      },
      {
        type: "heading",
        text: "1. Activities covered",
      },
      {
        type: "paragraph",
        text: 'This Waiver covers all LCB Training activities, including in-person lessons and group sessions, remote sessions, and the Twelve Week Coaching Program and any drills, workouts, sprints, strength, speed and agility, and mobility training done on my own using LCB Training content (the "Activities").',
      },
      {
        type: "heading",
        text: "2. Risks",
      },
      {
        type: "paragraph",
        text: "I understand baseball and physical training involve risks of injury, including but not limited to: being hit by a ball or bat; sprains, strains, and muscle injuries; overuse injuries; falls; injuries from equipment such as weights, bands, tees, and pitching machines; heat-related illness; and, in rare cases, serious injury or death. Some risks come from my own actions, others' actions, equipment, weather, or field and facility conditions.",
      },
      {
        type: "heading",
        text: "3. Training on my own",
      },
      {
        type: "paragraph",
        text: "Much of the Twelve Week Coaching Program is done without Coach Broc present. I understand that:",
      },
      {
        type: "bullets",
        items: [
          "I am responsible for choosing a safe place and safe equipment.",
          "I should warm up, use proper form, and stop any exercise that causes pain, dizziness, or trouble breathing.",
          "Players under 18 should have appropriate adult supervision, especially for strength training and any use of weights or machines.",
          "LCB Training does not supervise training I do on my own.",
        ],
      },
      {
        type: "heading",
        text: "4. Health",
      },
      {
        type: "paragraph",
        text: "I confirm the participant is in good health and able to take part in the Activities. I understand I should consult a doctor before starting any training program. I will tell Coach Broc about any injury, condition, or medication that could affect training. LCB Training does not give medical advice.",
      },
      {
        type: "heading",
        text: "5. Assumption of risk",
      },
      {
        type: "paragraph",
        text: "I voluntarily choose to take part in the Activities, and I accept the risks described above, known and unknown.",
      },
      {
        type: "heading",
        text: "6. Release",
      },
      {
        type: "paragraph",
        text: "To the fullest extent allowed by law, I release LCB Training from any claims for injury, illness, damage, or loss arising from the Activities, including claims based on LCB Training's ordinary negligence. This release does not cover gross negligence or willful misconduct.",
      },
      {
        type: "heading",
        text: "7. Parent or guardian agreement",
      },
      {
        type: "paragraph",
        text: "If the participant is under 18, I am their parent or legal guardian. I agree to this Waiver for the participant and for myself, I have explained the risks and safety rules to the participant, and I agree that the participant will follow them.",
      },
      {
        type: "heading",
        text: "8. Medical emergencies",
      },
      {
        type: "paragraph",
        text: "In an emergency during an in-person activity, I authorize LCB Training to call emergency services and seek first aid or medical treatment for the participant if I cannot be reached. I am responsible for any resulting medical costs.",
      },
      {
        type: "heading",
        text: "9. Other terms",
      },
      {
        type: "bullets",
        items: [
          "This Waiver is governed by Illinois law.",
          "If any part of this Waiver is found unenforceable, the rest stays in effect.",
          "This Waiver stays in effect for all Activities I take part in with LCB Training unless I cancel it in writing.",
          "My electronic agreement (checking the box and typing my name) has the same effect as a signature.",
        ],
      },
    ],
  },
};

export function getLegalDocument(id: LegalDocumentId): LegalDocumentConfig {
  return LEGAL_DOCUMENTS[id];
}
