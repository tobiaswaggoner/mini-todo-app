# **Architekturstrategie für SaaS-Monetarisierung und Entitlement-Management in Next.js/Supabase-Ökosystemen**

## **Executive Summary**

Die Transition von einer funktionalen Next.js-Anwendung hin zu einem monetarisierten SaaS-Produkt erfordert einen fundamentalen architektonischen Paradigmenwechsel. Für Entwickler, die im Vercel- und Supabase-Stack operieren, liegt die primäre Herausforderung nicht in der technischen Zahlungsabwicklung selbst, sondern in der Orchestrierung des **Entitlement Managements** – der Logik, die steuert, auf welche Features ein Nutzer basierend auf seinem Zahlungsstatus zugreifen darf. Die spezifische Anforderung des Nutzers, eine Lösung zu implementieren, die nicht selbst gebaut werden muss („Buy vs. Build“), dabei aber granulare „Feature Toggles“ und „Rate Limits“ ermöglicht, macht eine entkoppelte Architektur notwendig.

Die Analyse der aktuellen Marktlandschaft (Stand 2024/2025) zeigt, dass die effizienteste Strategie für eine Next.js/Supabase-Anwendung eine dreigeteilte Integration ist: **Lemon Squeezy** oder **Polar.sh** als „Merchant of Record“ (MoR) zur Übernahme der steuerlichen und rechtlichen Haftung, **Unkey** für die Durchsetzung von API-Rate-Limits am Edge, und **Schematic** oder **PostHog** für das Management von Feature-Flags und Berechtigungen. Dieser Bericht analysiert tiefgehend die verfügbaren Scaffolding-Lösungen, Integrationsmuster und architektonischen Entscheidungen, die notwendig sind, um diesen Stack experimentell und dennoch skalierbar mit minimalem Code-Overhead zu implementieren.

## **1\. Die strategische Landschaft der Merchant of Record (MoR) Lösungen**

Für einen Entwickler, der die operative Last der globalen Steuer-Compliance (EU VAT, US Sales Tax), des Rückerstattungsmanagements und der Rechnungsstellung vermeiden möchte, ist der Einsatz eines Merchant of Record (MoR) die einzig viable Strategie. Im Gegensatz zu einem reinen Payment Service Provider (PSP) wie Stripe (in seiner Standardform), agiert der MoR als Wiederverkäufer der digitalen Güter und übernimmt die volle rechtliche Verantwortung für die Transaktion gegenüber dem Endkunden.

### **1.1. Die Evolution der Zahlungsabwicklung im Next.js-Kontext**

Historisch gesehen integrierten Entwickler Stripe direkt und waren gezwungen, komplexe Logik für die Behandlung von Webhooks, die Berechnung von Steuern (oft über Stripe Tax als Zusatzdienst) und die Generierung von Rechnungen selbst zu implementieren. Die Anforderung des Nutzers, sich *nicht* um „Payment / Refunding“ kümmern zu wollen, schließt diese direkte Integration aus. Ein MoR abstrahiert diese Komplexität vollständig. Der Kunde kauft technisch gesehen beim MoR (z.B. Lemon Squeezy), und der MoR zahlt dem Entwickler einen „Payout“ aus. Dies schützt den Entwickler vor VAT MOSS-Compliance in der EU, Sales Tax Nexus in den USA und der direkten Bearbeitung von Chargebacks.

### **1.2. Lemon Squeezy: Der De-facto-Standard im Vercel-Ökosystem**

Lemon Squeezy hat sich als dominanter MoR für das Next.js/Supabase-Ökosystem etabliert, maßgeblich aufgrund seiner entwicklerzentrierten API und der Philosophie des „Hosted Checkout“, die exakt mit dem Wunsch des Nutzers übereinstimmt, keine eigenen UI-Komponenten für Zahlungen bauen zu müssen.1

#### **1.2.1. Architektonische Passgenauigkeit**

Das System bietet ein vollständig gehostetes „Customer Portal“, das Plan-Upgrades, Downgrades, die Aktualisierung von Zahlungsmethoden und den Zugriff auf Rechnungen extern abwickelt.2 Dies erfüllt die Anforderung, dass „das UI nicht zwingend in die App integriert sein muss“. Die Integrationslogik verlässt sich stark auf Webhooks, die kryptografisch signiert sind und von Next.js API-Routen (Serverless Functions) konsumiert werden, um den Zustand in Supabase zu synchronisieren.3

Seit der Übernahme durch Stripe im Jahr 2024 1 profitiert Lemon Squeezy von einer stabilen Infrastruktur, behält aber sein distinktes Wertversprechen als MoR bei, der die Komplexität von Stripe abstrahiert.

#### **1.2.2. Technische Integrationstiefe**

Die „einfache Integration“, die der Nutzer anstrebt, wird durch das offizielle SDK @lemonsqueezy/lemonsqueezy.js massiv erleichtert.2 Im Gegensatz zu älteren Systemen, die oft nur rohe REST-Calls anboten, liefert dieses SDK Typensicherheit für TypeScript-Nutzer, was in einem Next.js-Projekt essenziell ist. Die Integration erfordert typischerweise das Aufsetzen eines Synchronisationsmechanismus, der Produkte und Varianten (Pläne) von der API abruft, um Preistabellen zu rendern, sowie eines Webhook-Listeners, der auf Events wie subscription\_created, subscription\_updated und subscription\_cancelled reagiert.2

Ein kritischer Vorteil ist die Handhabung von „Proration“ (anteilige Verrechnung) bei Planwechseln, die Lemon Squeezy automatisch übernimmt. Würde man dies selbst bauen, müsste man komplexe mathematische Logik implementieren, um zu berechnen, wie viel Restwert ein Nutzer noch hat, wenn er in der Mitte des Monats von „Basic“ auf „Pro“ wechselt. Lemon Squeezy abstrahiert dies vollständig und sendet lediglich das Endergebnis per Webhook an die Applikation.

### **1.3. Polar.sh: Der Open-Source-Herausforderer und Developer-Darling**

Polar.sh repräsentiert einen Paradigmenwechsel hin zur „Developer-First“-Monetarisierung. Ursprünglich als Plattform zur Finanzierung von Open-Source-Projekten gestartet, hat sich Polar zu einem vollwertigen MoR für SaaS-Produkte entwickelt.4

#### **1.3.1. Vorteile für experimentelle Monetarisierung**

Für den spezifischen Anwendungsfall des Nutzers – ein „experimentelles“ Hinzufügen von Monetarisierung – bietet Polar signifikante Vorteile:

* **Kostenstruktur:** Polar berechnet ca. 4% \+ 40¢ pro Transaktion und liegt damit oft unter den Gebühren etablierter MoRs wie Paddle oder Lemon Squeezy (oft 5% \+ 50¢).5 Für ein Experiment mit ungewissem Ausgang minimiert dies die Margenverluste.  
* **Next.js Native Adapter:** Polar bietet mit @polar-sh/nextjs einen dedizierten Adapter, der die Erstellung von Checkout-Sessions und Customer Portals mit minimalem Boilerplate ermöglicht.6  
* **Integriertes "Benefits"-System:** Im Gegensatz zu Lemon Squeezy, das primär auf die Transaktion fokussiert ist, verfügt Polar über ein natives Konzept von „Benefits“ (Entitlements). Ein Abonnement in Polar gewährt direkt Zugriff auf definierte Vorteile (z.B. Zugang zu einem GitHub-Repo, Discord-Invites oder generische Lizenzschlüssel).8 Dies korrespondiert eng mit dem Wunsch des Nutzers nach „Feature Toggles“, die an Tiers gekoppelt sind.

#### **1.3.2. Einschränkungen**

Während Polar technisch exzellent ist, ist das Ökosystem an fertigen „Boilerplates“ (wie Supastarter) noch nicht so weit entwickelt wie bei Lemon Squeezy. Die Dokumentation ist stark, aber die Community-Ressourcen (Tutorials, YouTube-Guides) sind geringer. Zudem ist das Customer Portal funktional, bietet aber möglicherweise weniger Branding-Optionen als etablierte Konkurrenten.

### **1.4. Paddle: Die Enterprise-Alternative**

Paddle bleibt der Marktführer für hochvolumige SaaS-Anwendungen, wird jedoch oft für seine steilere Lernkurve kritisiert. Obwohl es in einigen Kategorien als „Beste Software“ geführt wird 9, sind Dokumentation und Tooling weniger auf die spezifische Persona des „Vercel/Next.js Indie Hackers“ zugeschnitten als bei Lemon Squeezy oder Polar. Die Integration erfordert oft mehr client-seitiges JavaScript für Overlay-Checkouts. Da der Nutzer explizit angibt, dass ein externes UI akzeptabel ist, bieten die Redirect-Flows von Lemon Squeezy oder Polar eine simplere Implementierung. Paddle ist overkill für ein Experiment.

### **1.5. Vergleich der MoR-Lösungen**

Die folgende Tabelle stellt die relevanten Dimensionen für die Entscheidungsfindung gegenüber:

| Feature Dimension | Lemon Squeezy | Polar.sh | Paddle |
| :---- | :---- | :---- | :---- |
| **MoR Status** | Ja (Volle Steuerhaftung) | Ja (Volle Steuerhaftung) | Ja (Volle Steuerhaftung) |
| **Next.js SDK** | Offiziell (@lemonsqueezy/lemonsqueezy.js) | Offiziell (@polar-sh/nextjs) | Offiziell (@paddle/paddle-node-sdk) |
| **UI-Anforderung** | Hosted Checkout & Portal (Extern) | Hosted Checkout & Portal (Extern) | Overlay oder Inline (Integriert) |
| **Entitlement-Logik** | Basierend auf Lizenzschlüsseln / Webhooks | Eingebautes „Benefits“-System | Manuelle Implementierung notwendig |
| **Preisstruktur** | \~5% \+ 50¢ pro Transaktion | \~4% \+ 40¢ pro Transaktion | \~5% \+ 50¢ pro Transaktion |
| **Feature Toggles** | Extern via Webhook-Mapping nötig | Teilweise nativ (für Dev-Tools) | Extern via Webhook-Mapping nötig |
| **Zielgruppe** | Indie Hacker / SaaS Startups | Developer Tools / Open Source | Enterprise / Scale-ups |

### **1.6. Strategische Empfehlung**

Für das Ziel, **experimentell** und mit **minimalem Aufwand** eine Monetarisierung hinzuzufügen, ist **Polar.sh** aufgrund der Kostenstruktur und der modernen API eine exzellente Wahl. Wenn jedoch die **Wiederverwendbarkeit** („in potentiell weitere Apps immer gleich einbauen“) und der Zugriff auf ein breites Ökosystem an **Scaffolding** (fertigen Vorlagen) Priorität haben, ist **Lemon Squeezy** die sicherere und robustere Entscheidung. Da der Nutzer explizit nach „Fertigem Scaffolding“ fragte, wird die weitere Architekturempfehlung primär auf Lemon Squeezy basieren, wobei Polar als valide Alternative für reine Developer-Tools genannt bleibt.

## **2\. Entitlement Management: Die Entkopplung von Billing und Logik**

Ein häufiges Missverständnis bei der SaaS-Entwicklung ist die Vermischung von **Billing** (Geldeinzug) und **Entitlement** (Zugriffsgewährung). Der Nutzer fordert explizit „Feature Toggles“ oder „Rate Limits“ auf Basis der User-Stufe. Das Hardcoding dieser Prüfungen im Anwendungscode (z.B. if (user.plan \=== 'pro\_monthly\_2024')) ist eine technische Schuld, die schnell untragbar wird. Pläne ändern sich, Preise ändern sich, aber die Features („Zugriff auf AI-Modell“) sollten abstrahiert bleiben.

### **2.1. Das "Entitlement-as-a-Service" Pattern**

Um die Anforderung „nicht selber bauen“ konsequent umzusetzen, muss die Architektur ein Entitlement Management System integrieren. Dieses System fungiert als Middleware, die das generische Signal „Abonnement aktiv“ vom MoR in granulare Berechtigungen übersetzt (z.B. „Darf 5 Projekte anlegen“).

#### **2.1.1. Schematic: Die Premium-Lösung für Feature Toggles**

Schematic 10 identifiziert sich als die robusteste Lösung, die Feature Flags und Entitlement Management kombiniert. Es ist speziell dafür gebaut, zwischen dem Billing-Provider (Lemon Squeezy) und der Applikation zu sitzen.

* **Funktionsmechanismus:** Schematic ingestiert Abonnementdaten vom MoR (via Integration) und mappt diese auf im Schematic-Dashboard definierte „Pläne“.  
* **Feature Toggles:** Der Entwickler definiert Features (z.B. „Advanced Analytics“) in Schematic und schaltet diese pro Plan an oder aus.  
* **Integration in Next.js:** In der App wird ein Hook oder ein serverseitiger Call verwendet: schematic.check('feature-key', { user\_id }). Dies gibt einen Boolean oder ein Limit zurück.12  
* **Pricing & Experimentierphase:** Obwohl Schematic auch Enterprise-Kunden bedient, bietet es einen kostenlosen Tier für bis zu 10 monetarisierte Abonnements an.13 Dies passt perfekt zur „experimentellen“ Phase des Nutzers.  
* **Strategischer Fit:** Es erfüllt vollständig den Wunsch, Feature Toggles und Limits basierend auf Tiers zu verwalten, ohne Datenbanklogik schreiben zu müssen, die subscriptions-Tabellen manuell prüft. Änderungen an Paketen (z.B. „Feature X ist jetzt auch im Basic-Plan“) erfolgen im Dashboard, ohne Code-Deploy.

#### **2.1.2. PostHog: Der Analytics-Getriebene Ansatz**

PostHog ist primär als Analytics-Tool bekannt, bietet aber ein extrem mächtiges Feature Flagging System, das auf „Cohorts“ oder „Groups“ basieren kann.14

* **Integration:** Abonnementdaten von Lemon Squeezy können als Group Properties (z.B. group.stripe\_product\_id oder group.plan\_tier) zu PostHog synchronisiert werden.  
* **Logik:** Ein Feature Flag in PostHog wird so konfiguriert, dass es nur für die Kohorte „Pro Plan User“ aktiv ist.  
* **Vorteil:** Wenn der Nutzer bereits PostHog für Analytics einsetzt (was im Vercel-Umfeld sehr üblich ist), konsolidiert dies den Toolstack.  
* **Nachteil:** Es ist weniger spezialisiert auf „metered“ Entitlements (z.B. „noch 5 Credits übrig“) im Vergleich zu Schematic, das hierfür dedizierte Zähler hat.

### **2.2. Rate Limiting als dediziertes Entitlement: Unkey**

Der Nutzer fragte spezifisch nach „Rate Limits“ auf Basis der aktuellen Stufe. Hier ist **Unkey** der Industriestandard für diesen spezifischen Micro-Service im Serverless-Umfeld.15

* **Das Problem mit Vercel & Rate Limits:** Next.js auf Vercel läuft auf Edge oder Serverless Functions. Diese sind zustandslos (stateless). Man kann keinen Zähler im Arbeitsspeicher halten (z.B. let requests \= 0), da jede Anfrage potenziell eine neue Instanz startet. Man benötigt einen externen, extrem schnellen Store. Redis (z.B. via Upstash) ist die klassische Lösung, erfordert aber Implementierungsaufwand.  
* **Die Unkey-Lösung:** Unkey bietet „Ratelimit as a Service“. Es nutzt ein global verteiltes Backend, exponiert dieses aber über eine simple HTTP-API.  
* **Plan-Basierte Limits:** Man kann unterschiedliche Limits für unterschiedliche Identitäten definieren.  
  * Wenn ein Nutzer eine Anfrage an eine API-Route stellt, ruft die Next.js Middleware Unkey auf.  
  * Der Limit-Identifier wird als user\_${userId} konstruiert.  
  * Die Höhe des Limits (Magnitude) wird basierend auf dem Plan des Nutzers (aus Supabase oder einem JWT-Claim) dynamisch an Unkey übergeben.  
* **No-Code Anpassung:** Unkey erlaubt es, Limits im Dashboard anzupassen, ohne die Next.js App neu zu deployen, was den „Feature Toggle“-Aspekt der Rate Limits erfüllt.

## **3\. Scaffolding und Boilerplates: Der Beschleuniger**

Der Nutzer fragte explizit nach „Fertiges Scaffolding, Sites, whatever“, um die Integration nicht selbst bauen zu müssen. Es existieren mehrere hochqualitative Boilerplates, die Next.js, Supabase und Lemon Squeezy vorkonfiguriert verbinden.

### **3.1. Supastarter: Der Spezialist für diesen Stack**

**Supastarter** 16 ist ein production-ready Boilerplate, das exakt auf den Stack Next.js \+ Supabase \+ Lemon Squeezy abzielt.

* **Vorgebaute Features:** Es beinhaltet bereits die Webhook-Handler für Lemon Squeezy, das Datenbankschema für Supabase (Mapping von Plänen/Subscriptions) und den Authentifizierungs-Flow.  
* **Entitlements:** Es bringt Logik für „Seat-based billing“ und Organisationsmanagement mit, was die „Plan \-\> Access“-Logik out-of-the-box löst.  
* **Dokumentation & Blog:** Es enthält Module für Dokumentation und Blogs, was indirekt hilft, die Anforderungen der MoRs zu erfüllen (diese verlangen oft sichtbare AGBs/Impressum auf der Seite).  
* **Wert:** Es spart geschätzte 20-40 Stunden Integrationsarbeit, die nötig wären, um Webhook-Security, Signaturverifizierung und Datenbank-Upserts korrekt und robust zu implementieren.

### **3.2. Shipped.club: Der Indie-Hacker-Favorit**

**Shipped.club** 18 ist ein weiterer starker Kandidat, der spezifisch für „beschäftigte Entwickler“ und Solopreneure vermarktet wird.

* **Monetarisierung:** Unterstützt sowohl Lemon Squeezy als auch Stripe.  
* **Differenzierung:** Der Fokus liegt stark auf dem Marketing-Aspekt (Landing Pages, Waitlists) zusätzlich zum Auth/Billing-Kern. Wenn der Nutzer für das Experiment auch eine Marketing-Seite benötigt, ist dies die überlegene Wahl.  
* **Feature Gating:** Es bietet Komponenten für „Private Pages“, die Logik ist jedoch oft weniger granular abstrahiert als bei spezialisierten Entitlement-Lösungen.19

### **3.3. Makerkit (Turbo Version)**

**Makerkit** 20 bietet ein „Next.js Supabase Turbo“-Kit an.

* **Architektur:** Es nutzt eine Monorepo-Struktur (Turborepo), was für ein einfaches Experiment eventuell Overkill ist, aber höchste Skalierbarkeit bietet.  
* **Billing:** Enthält vorgebaute Abstraktionen für Lemon Squeezy und Stripe, die es erlauben, den Provider durch einfache Änderung von Umgebungsvariablen zu wechseln.  
* **Feature Flags:** Makerkit besitzt eine eingebaute Konfigurationsdatei für Feature Flags (feature-flags.config.ts), was eine leichtgewichtige, code-basierte Alternative zu Schematic darstellt.22

### **3.4. Warnung vor veralteten Lösungen (Tier.run)**

Bei der Recherche stößt man eventuell auf **Tier.run**. Die Analyse zeigt jedoch, dass dieses Projekt (Stand 2024/2025) als „Out of Business“ oder nicht mehr aktiv gewartet gilt.23 Trotz der theoretischen Passgenauigkeit (Stripe Sync, Pricing Tables) sollte es für neue Projekte **nicht** mehr verwendet werden.

### **3.5. Empfehlung für Scaffolding**

Für ein rein experimentelles Add-on zu einer *bestehenden* App sind die Patterns von **Supastarter** am besten als Referenz geeignet. Wenn der Nutzer bereit ist, das Projekt auf einer neuen Basis aufzusetzen (oder Code zu migrieren), ist **Supastarter** der engste Match für die Anforderungen.

## **4\. Architektonischer Implementierungs-Blueprint**

Basierend auf der Analyse ergibt sich die folgende Architektur, die eine robuste „No-Build“-Erfahrung bietet und alle Anforderungen erfüllt.

### **4.1. Der Goldene Tech-Stack**

1. **App Framework:** Next.js (App Router) auf Vercel.  
2. **Datenbank/Auth:** Supabase.  
3. **Billing (MoR):** **Lemon Squeezy** (gewählt wegen Ökosystem-Reife und Customer Portal).  
4. **Entitlement/Flags:** **Schematic** (gewählt für No-Code Plan-Management und Integrationstiefe).  
5. **Rate Limiting:** **Unkey** (gewählt für Edge-Kompatibilität und Einfachheit).

### **4.2. Datenfluss und Integrationslogik**

Die Integration folgt einem ereignisgesteuerten Modell, das sicherstellt, dass die Anwendung (Next.js) immer den aktuellen Status kennt, ohne selbst komplexe State-Machines für Zahlungen verwalten zu müssen.

#### **Schritt 1: Der Billing-Trigger (Extern)**

Der Nutzer wählt in der App einen Plan. Anstatt ein eigenes Checkout-Formular zu rendern, leitet die App den Nutzer zu einer **Lemon Squeezy Checkout URL** weiter.2 Diese URL ist für jede Variante (Plan Tier) vorgeneriert.

* *Optimierung:* Übergeben Sie die user\_id von Supabase Auth als checkout\_data (Custom Data) in der Lemon Squeezy URL. Dies ist essenziell, damit der Webhook die Zahlung später dem korrekten Nutzer zuordnen kann. Ohne dies entstehen „verwaiste“ Zahlungen.

#### **Schritt 2: Webhook-Synchronisation (Der "Klebstoff")**

Lemon Squeezy sendet einen subscription\_created Webhook an den Next.js Endpunkt /api/webhooks/lemonsqueezy.

* **Verifizierung:** Der Endpunkt **muss** den X-Signature-Header unter Verwendung des LEMONSQUEEZY\_WEBHOOK\_SECRET verifizieren.2 Dies verhindert, dass Angreifer gefälschte Zahlungsbestätigungen senden.  
* **Verarbeitung:**  
  1. Extrahieren der user\_id aus meta.custom\_data.  
  2. Extrahieren der variant\_id (Plan ID) und des status (active/past\_due).  
  3. **Aktion:** Update der Tabelle profiles oder organizations in Supabase.  
  * *Schema-Empfehlung:* Fügen Sie Spalten wie subscription\_status, plan\_variant\_id und current\_period\_end zur User-Tabelle hinzu. Speichern Sie **keine** Kreditkartendaten oder Rechnungsdetails; verlassen Sie sich hierfür vollständig auf das MoR-Portal.

#### **Schritt 3: Entitlement Provisionierung (Schematic)**

Anstatt im Code if (user.plan \=== 'pro') zu schreiben, nutzt die Architektur Schematic.

* **Sync:** Wenn der Webhook Supabase aktualisiert, kann er (oder ein Supabase Database Webhook/Edge Function) auch ein „Company Upsert“ an Schematic senden, um zu signalisieren: „Nutzer X ist jetzt im Plan Y“.  
* **Nutzung:** Im Frontend oder Backend wird das Schematic SDK genutzt:  
  TypeScript  
  // Server Component Beispiel  
  import { schematic } from '@/lib/schematic';

  // Prüft, ob das Feature für den aktuellen Nutzer im aktuellen Plan aktiv ist  
  if (await schematic.checkFlag('ai-generation', { company: { id: user.id } })) {  
     // Erlaube Zugriff auf das Feature  
  }

* Dies erlaubt es, das Feature „ai-generation“ für den „Pro“-Plan im Schematic-Dashboard zu deaktivieren, ohne die App neu zu deployen.24

#### **Schritt 4: Durchsetzung von Rate Limits (Unkey)**

Für die Anforderung „Rate Limits basierend auf User Tier“ wird Unkey via Next.js Middleware integriert.

* **Logik:**  
  1. Middleware fängt den Request ab.  
  2. Prüft Supabase (oder das gecachte JWT) auf die plan\_variant\_id des Nutzers.  
  3. Ruft Unkey auf: unkey.ratelimit.limit(userId, { cost: 1, limit: PLAN\_LIMITS\[variant\_id\] }).25  
  4. Wenn Unkey success: false zurückgibt, wird sofort 429 Too Many Requests retourniert.

### **4.3. Implementierung der Feature Toggles**

Der Nutzer möchte Features „togglen“. Diese Architektur bietet zwei Ebenen:

1. **Globale Toggles:** Verwaltet über Vercel Environment Variables oder Schematic Global Flags (z.B. „Wartungsmodus“).  
2. **Plan-Basierte Toggles:** Verwaltet über Schematic Entitlements (z.B. „Silver Plan erhält 4k Video“). Dies erfüllt die Anforderung nach „Rate Limits oder Feature Toggles auf Basis der aktuellen Stufe“ perfekt.

## **5\. Implementierungs-Roadmap (Experimentelle Phase)**

Da der Nutzer „experimentell“ und „einfach“ vorgehen möchte, wird folgender phasenweiser Ansatz empfohlen, um Kosten und Aufwand zu minimieren.

### **Phase 1: Die "Lite" Integration (Ohne Schematic/Unkey)**

Starten Sie nur mit **Lemon Squeezy** und **Supabase RLS**.

1. Erstellen Sie Produkte in Lemon Squeezy.  
2. Fügen Sie eine plan\_id Spalte zur Supabase profiles Tabelle hinzu.  
3. Deployen Sie eine einzelne API Route (/api/webhook), um das subscription\_created Event von Lemon Squeezy zu verarbeiten.  
4. **Feature Toggle:** Nutzen Sie Supabase Row Level Security (RLS) Policies.  
   * *Beispiel:* create policy "Pro features" on "premium\_content" for select using ( auth.uid() in (select id from profiles where plan\_id \= 'pro') );  
   * *Vorteil:* Null Zusatzkosten, keine externen SaaS-Abhängigkeiten außer MoR.  
   * *Nachteil:* Änderungen an Limits erfordern Datenbank-Migrationen; Rate Limiting ist schwer umzusetzen.

### **Phase 2: Hinzufügen der Abstraktion (Schematic/Unkey)**

Sobald das Experiment Umsatz validiert hat oder komplexere Anforderungen (Rate Limits) kritisch werden:

1. Installieren Sie **Unkey**, um teure API-Routen (z.B. AI-Generierung) zu schützen.  
2. Installieren Sie **Schematic**, wenn das Preismodell komplexer wird (z.B. nutzungsbasierte Abrechnung, „3 Sitze inklusive, dann $5/Sitz“).

## **6\. Kritische technische Überlegungen und Fallstricke**

### **6.1. Das "Source of Truth" Dilemma**

Ein häufiger Fehler ist das Entstehen von „Split-Brain“-Zuständen, bei denen Lemon Squeezy ein Abo als aktiv führt, Supabase es aber als gekündigt betrachtet (oder umgekehrt).

* **Lösung:** Behandeln Sie den **Webhook** immer als die einzige Quelle der Wahrheit („Source of Truth“). Aktualisieren Sie den Abonnementstatus **niemals** basierend auf client-seitigen Success-Callbacks (z.B. der „Danke“-Seite). Böswillige Nutzer können client-seitige Flows manipulieren oder die Seite direkt aufrufen, ohne zu zahlen. Nur der Server-zu-Server Webhook ist vertrauenswürdig.2

### **6.2. User-Identifikation in Webhooks**

Lemon Squeezy Webhooks wissen standardmäßig nicht, welcher Supabase User ID eine Zahlung zugeordnet ist. Sie **müssen** den Parameter checkout\[custom\]\[user\_id\] beim Generieren der Checkout-URL übergeben.3 Wenn dies vergessen wird, erhalten Sie Zahlungsbenachrichtigungen, können diese aber keinem Nutzer zuordnen, was manuelle Support-Arbeit erzeugt.

### **6.3. Handhabung von Upgrades/Downgrades**

Wenn ein Nutzer im Portal von „Basic“ auf „Pro“ upgradet, sendet Lemon Squeezy einen subscription\_updated Webhook. Ihr Handler muss robust genug sein, um nicht nur status zu aktualisieren, sondern auch die variant\_id (den Plan) zu ändern. Schematic erleichtert dies, da es diese Änderungen automatisch in Berechtigungen übersetzt, wenn es korrekt angebunden ist.

## **7\. Finanzielle und Operative Analyse**

### **7.1. Kostenstruktur des empfohlenen Stacks**

Für ein Experiment sind die Fixkosten entscheidend.

* **Lemon Squeezy:** Keine monatlichen Fixkosten. Gebühr nur bei Transaktion (\~5%). Ideal für Experimente.  
* **Supabase:** Free Tier ist sehr großzügig (500MB DB).  
* **Vercel:** Free Tier für Hobby/Experimente ausreichend.  
* **Schematic:** Bietet einen Free Tier für kleine Projekte.  
* **Unkey:** Bietet einen großzügigen Free Tier für Rate Limiting.

**Fazit:** Der Stack verursacht im Leerlauf (ohne Kunden) **0€ Fixkosten**. Dies erfüllt die Anforderung nach einer „experimentellen“ Integration perfekt.

### **7.2. Wartbarkeit und Reusability**

Da der Nutzer die Lösung „in potentiell weitere Apps immer gleich einbauen“ möchte, empfiehlt es sich, die Logik (Webhook Handler \+ Schematic Wrapper \+ Unkey Middleware) in ein internes npm-Package oder ein Shared-Repository (Template) auszulagern. Da alle gewählten Tools (Lemon Squeezy, Schematic, Unkey) API-First sind und hervorragende TypeScript-SDKs bieten, lässt sich dieser Code sehr gut typisieren und wiederverwenden.

## **8\. Detaillierte Analyse der Tools und Services**

### **8.1. Lemon Squeezy (Deep Dive)**

* **Dokumentation & SDK:** Die Bibliothek @lemonsqueezy/lemonsqueezy.js ist strikt typisiert und wird aktiv gewartet, was Integrationsfehler drastisch reduziert.2  
* **Customer Portal:** Dies ist das "Killer-Feature" für die experimentelle Phase. Sie müssen kein UI für „Kreditkarte aktualisieren“ oder „Rechnung herunterladen“ bauen. Sie verlinken den Nutzer einfach auf seine einzigartige Customer Portal URL, die via API oder Webhook abgerufen werden kann.2  
* **Webhooks:** Das System verlässt sich auf eine robuste Webhook-Architektur. Sie müssen auf folgende Events hören:  
  * subscription\_created  
  * subscription\_updated (z.B. Planwechsel)  
  * subscription\_cancelled (Nutzer kündigt, Zugriff bleibt aber bis ends\_at bestehen)  
  * subscription\_expired (Zugriff muss entzogen werden).2

**Der "Gotcha":** Lemon Squeezy unterstützt nicht „multiple line items“ auf dieselbe Weise wie Stripe (z.B. Mischung aus Pauschalgebühr und verbrauchsabhängiger Gebühr in einem Abo ist komplex).26 Wenn das Experiment komplexes Metered Billing erfordert (z.B. „pay per AI token“), könnten die „Usage-based billing“-Features weniger flexibel sein als bei Stripe nativ. Für Standard-Tiers (Free, Pro, Team) ist es jedoch ideal.

### **8.2. Schematic vs. LaunchDarkly**

Der Nutzer fragte nach Feature Toggles. LaunchDarkly ist der Platzhirsch, aber für dieses Szenario oft zu teuer und zu komplex.

* **Schematic:** Ist „Billing-Aware“. Es versteht Konzepte wie „Pläne“ und „Add-ons“ nativ.  
* **LaunchDarkly:** Ist ein generisches Feature-Flagging-Tool. Man müsste die Logik „Wenn Plan Pro, dann Flag True“ selbst mappen und pflegen.27  
* **Empfehlung:** Schematic ist für monetarisierte Feature Toggles die überlegene Wahl.

## **9\. Zusammenfassung und Handlungsempfehlung**

Um die Anforderungen des Nutzers – experimentelle Monetarisierung, kein eigener Bau von Payment-UI/Logik, Feature Toggles und Rate Limits nach Stufe – zu erfüllen, wird folgende Vorgehensweise empfohlen:

1. **MoR wählen:** Nutzen Sie **Lemon Squeezy**. Das gehostete Customer Portal spart Wochen an UI-Arbeit und löst das Problem der Rechnungsstellung und Steuer vollständig.  
2. **Scaffolding nutzen:** Orientieren Sie sich an **Supastarter** für den Webhook-Handler-Code oder erwerben Sie das Boilerplate, um die Integration zu beschleunigen.  
3. **Entitlements (Feature Toggles):** Integrieren Sie **Schematic** (Free Tier). Mappen Sie Lemon Squeezy Pläne auf Features. Dies ist der „Zero Code“-Weg, um Berechtigungen zu verwalten, ohne die App neu zu deployen.  
4. **Rate Limiting:** Nutzen Sie **Unkey.dev**. Es ist die einzige Lösung, die per-User Rate Limits in einer Serverless-Umgebung (Vercel) elegant und ohne eigene Redis-Infrastruktur löst.

Diese Architektur externalisiert jegliche komplexe Logik: Lemon Squeezy kümmert sich um Geld und Gesetz, Schematic um die Feature-Logik und Unkey um den Missbrauchsschutz. Die Supabase-Datenbank speichert lediglich eine Referenz auf den Plan, was die App-Architektur sauber und „experimentierfreundlich“ hält.

### **Übersicht der Tools**

| Komponente | Empfehlung | Alternative | Warum? |
| :---- | :---- | :---- | :---- |
| **Merchant of Record** | **Lemon Squeezy** | Polar.sh | Beste Next.js Docs, Customer Portal inkludiert. |
| **Feature Flags** | **Schematic** | PostHog | Entkoppelt „Plan“ von „Feature“-Code, billing-aware. |
| **Rate Limiting** | **Unkey** | Upstash Redis | Einfachste Integration für Vercel Serverless. |
| **Boilerplate** | **Supastarter** | Shipped.club | Tiefste Lemon Squeezy Integration. |

Mit diesem Setup ist die Applikation zukunftssicher aufgestellt, während der initiale Implementierungsaufwand auf das absolute Minimum reduziert wird.

#### **Referenzen**

1. Best MoR Platforms for Freelancers \- Ruul, Zugriff am Dezember 27, 2025, [https://ruul.io/blog/top-merchant-of-record-platforms-for-freelancers](https://ruul.io/blog/top-merchant-of-record-platforms-for-freelancers)  
2. Guides: Building a SaaS Billing Portal in Next.js with Lemon Squeezy, Zugriff am Dezember 27, 2025, [https://docs.lemonsqueezy.com/guides/tutorials/nextjs-saas-billing](https://docs.lemonsqueezy.com/guides/tutorials/nextjs-saas-billing)  
3. Best way to integrate subscription payments | Next.js \+ Lemon Squeezy \+ Supabase, Zugriff am Dezember 27, 2025, [https://www.youtube.com/watch?v=tktd3jTRqZA](https://www.youtube.com/watch?v=tktd3jTRqZA)  
4. Why Polar is the best way to monetize your software, Zugriff am Dezember 27, 2025, [https://polar.sh/resources/why](https://polar.sh/resources/why)  
5. Stripe vs Polar.sh: Which Payment Platform is Best for Your SaaS? | Buildcamp, Zugriff am Dezember 27, 2025, [https://www.buildcamp.io/blogs/stripe-vs-polarsh-which-payment-platform-is-best-for-your-saas](https://www.buildcamp.io/blogs/stripe-vs-polarsh-which-payment-platform-is-best-for-your-saas)  
6. Next.js \- Polar, Zugriff am Dezember 27, 2025, [https://polar.sh/docs/integrate/sdk/adapters/nextjs](https://polar.sh/docs/integrate/sdk/adapters/nextjs)  
7. Integrate Polar with Next.js, Zugriff am Dezember 27, 2025, [https://polar.sh/docs/guides/nextjs](https://polar.sh/docs/guides/nextjs)  
8. Automated Benefits \- Polar, Zugriff am Dezember 27, 2025, [https://polar.sh/docs/features/benefits/introduction](https://polar.sh/docs/features/benefits/introduction)  
9. Best Merchant of Record Software: User Reviews from December 2025 \- G2, Zugriff am Dezember 27, 2025, [https://www.g2.com/categories/merchant-of-record](https://www.g2.com/categories/merchant-of-record)  
10. What is Schematic? | SchematicHQ, Zugriff am Dezember 27, 2025, [https://docs.schematichq.com/what-is-schematic](https://docs.schematichq.com/what-is-schematic)  
11. Schematic \- Ship pricing faster, Zugriff am Dezember 27, 2025, [https://schematichq.com/](https://schematichq.com/)  
12. Feature Management Overview | SchematicHQ \- Schematic Docs, Zugriff am Dezember 27, 2025, [https://docs.schematichq.com/feature-management/overview](https://docs.schematichq.com/feature-management/overview)  
13. Schematic Pricing, Zugriff am Dezember 27, 2025, [https://schematichq.com/pricing](https://schematichq.com/pricing)  
14. Feature flags \- Docs \- PostHog, Zugriff am Dezember 27, 2025, [https://posthog.com/docs/feature-flags](https://posthog.com/docs/feature-flags)  
15. Rate limiting in Next.js in under 10 minutes \- James Perkins, Zugriff am Dezember 27, 2025, [https://www.jamesperkins.dev/post/rate-limiting-nextjs/](https://www.jamesperkins.dev/post/rate-limiting-nextjs/)  
16. Next.js \+ Lemon Squeezy SaaS Boilerplate \- supastarter, Zugriff am Dezember 27, 2025, [https://supastarter.dev/nextjs-lemonsqueezy-boilerplate](https://supastarter.dev/nextjs-lemonsqueezy-boilerplate)  
17. Next.js Subscriptions SaaS Template | supastarter \- SaaS starter kit for Next.js and Nuxt, Zugriff am Dezember 27, 2025, [https://supastarter.dev/nextjs-subscriptions-template](https://supastarter.dev/nextjs-subscriptions-template)  
18. Shipped.club, Zugriff am Dezember 27, 2025, [https://shipped.club/](https://shipped.club/)  
19. Payments | Shipped, Zugriff am Dezember 27, 2025, [https://docs.shipped.club/features/payments](https://docs.shipped.club/features/payments)  
20. How Billing works in the Next.js Supabase SaaS kit \- Makerkit, Zugriff am Dezember 27, 2025, [https://makerkit.dev/docs/next-supabase-turbo/billing/overview](https://makerkit.dev/docs/next-supabase-turbo/billing/overview)  
21. Next.js Supabase SaaS Boilerplate | Build Full-Stack SaaS Apps Fast \- Makerkit, Zugriff am Dezember 27, 2025, [https://makerkit.dev/next-supabase](https://makerkit.dev/next-supabase)  
22. How to customize your Makerkit Next.js Supabase Turbo project, Zugriff am Dezember 27, 2025, [https://makerkit.dev/courses/nextjs-turbo/customization](https://makerkit.dev/courses/nextjs-turbo/customization)  
23. Tier.run 2025 Company Profile: Valuation, Funding & Investors | PitchBook, Zugriff am Dezember 27, 2025, [https://pitchbook.com/profiles/company/509070-34](https://pitchbook.com/profiles/company/509070-34)  
24. How to use feature flags to manage entitlements without writing code \- Schematic, Zugriff am Dezember 27, 2025, [https://schematichq.com/blog/guide-how-to-use-feature-flags-to-manage-entitlements-without-writing-code](https://schematichq.com/blog/guide-how-to-use-feature-flags-to-manage-entitlements-without-writing-code)  
25. Quickstart \- Unkey Docs, Zugriff am Dezember 27, 2025, [https://www.unkey.com/docs/quickstart/identities/shared-ratelimits](https://www.unkey.com/docs/quickstart/identities/shared-ratelimits)  
26. Configuring Lemon Squeezy Billing in the Next.js Supabase SaaS Starter Kit \- Makerkit, Zugriff am Dezember 27, 2025, [https://makerkit.dev/docs/next-supabase-turbo/billing/lemon-squeezy](https://makerkit.dev/docs/next-supabase-turbo/billing/lemon-squeezy)  
27. Flags for modern software delivery \- LaunchDarkly, Zugriff am Dezember 27, 2025, [https://launchdarkly.com/features/feature-flags/](https://launchdarkly.com/features/feature-flags/)