# Midnight Passport — Product Presentation & Whiteboard Session (Transcript)

**Source:** NightForce whiteboard session. Audio files referenced: `p1.mp3`, `p2.mp3`,
`p3.mp3`, `p4.mp3`.
**Speakers:** Charles Hoskinson (intro), **Carmel/Karmel** (product lead), **Hector**
(technical demo).
**Captured:** 2026-07-04. Preserved verbatim (English original + Russian translation).

> Naming note: the transcript spells the product lead "Carmel." Our contributor records
> show GitHub `Karmoola` / email `karmel.abdeljawad@gmail.com`. This session **confirms
> Karmel is the Passport product lead**, backed by ARC ("Ark") and cryptographers.

---

## DOCUMENT 1: ORIGINAL TEXT (ENGLISH)

**Title:** Midnight Passport Product Presentation and Whiteboard Session
**Files Referenced:** p1.mp3, p2.mp3, p3.mp3, p4.mp3

### 1. Introduction by Charles Hoskinson

The Passport is the first product we've built which is going to have a billion users. So,
no pressure at all. But it's long overdue, and it's the missing piece to the entire
cryptocurrency ecosystem. It adds the simplicity and safety required for mass adoption.

I am so glad that we have an all-star team who are working on it. Carmel is a wonderful
product lead, and she's backed by Ark and some of the smartest cryptographers on the
planet. This is a Tier 1 product for us at Midnight.

You guys in the Night Force are going to be the first vanguard to tell us what we've done
wrong. As smart as we are, no one is smarter than the crowd, and you're going to find all
kinds of ways to break it, enhance it, and take it to the next level. So just like
Decrypt, just like Midnight City, and hopefully Offer Files soon, you are kind of the beta
testers.

I wanted to make sure that we reserve some space in the whiteboard sessions to bring
people that are building real things, that are going to have meaningful and significant
impact at Midnight, to all of you. So you have a chance to see it, understand it, and
hopefully ask questions about it, and then long-term be available to the team to help beta
test it as we take it to the next level.

Without further ado, I'd like to turn it over to Carmel and have her explain where the
project came from and show us what she's got.

### 2. Product Context and Market Trends (Carmel)

Fantastic, I will go ahead and set the stage. I am joined by Hector on the team, and
Hector will guide us through an actual technical demo that we've put together, but I will
start with some context around what we're doing. Let me share my screen for a second.

When we're thinking about Passport, first off, from a product perspective, we're looking
at some of the gaps and what is happening in the landscape. We see three trends that are
ongoing:

- **Web3 Top-of-Funnel Problem:** Web3 loses a lot of users because there's a
  top-of-funnel problem. That tells us there's something broken when it comes to
  onboarding. There's something broken when it comes to getting the user to see the
  value-add that blockchain gives them. That is a UX problem, that is a cross-chain
  problem, and that is possibly a KYC identity problem.
- **Agentic AI and Commerce:** Another shift that we're seeing that is taking off is
  agentic AI and agentic commerce. That is something we can't ignore. We are treating
  agents as personas — like me, you, and others — that will be using blockchain, Web3,
  Web2, etc. They need to have their journeys defined and be able to accommodate for them.
- **Identity Shift:** There is a big shift around identity. There is biometric scanning
  happening right now in airports and many places. There's a lot of regulation and policy
  around digital identity, sites requiring you to validate your age, etc.

When we think of these three together, what are the gaps and how can we, with Passport and
our behind-the-scenes tech, resolve them in a way where it's seamless for the user without
adding a learning curve?

### 3. Onboarding Obstacles and User Friction

Where do we lose people when it comes to onboarding? When we get 100% of our users to land
on a DApp, we've communicated the value, they're interested, they're excited. But then
they figure out: "Oh, I have to connect a wallet." What does that even mean? "And I have
to have a seed phrase." Why? Who's going to use that, who's going to remember that, who's
going to take a screenshot of it? We lose a majority of users just right there.

Then, getting to that first transaction: there are gas fees; you have to figure out where
to get this asset from; if I do have an asset from somewhere else, I have to have some sort
of gas to interact with this network.

These are very major obstacles for adoption. These failures together compound and block
adoption generally. The way we're approaching this is not to solve it just for Midnight and
be siloed, but how do we become aware of users on Ethereum, Solana, or Bitcoin? How do we
make sure this requires the least amount of friction?

We have the seed phrase problem, identity versus privacy, cross-chain compatibility, and
the fact that there is no recovery. Once you've lost your wallet or your passkey, you
cannot get access to it. That's a very big problem.

### 4. Architectural Abstract and Four Personas

The abstractions we are going to work towards and solve for are: Account Creation and
Ownership, Account Abstraction, and Chain Abstraction. We're solving them in an elegant way
that allows you to interact with the network and get the highest value immediately.

There are four personas that are going to benefit from Passport:

- **Individual:** That's me, holding my wallet and my account.
- **Managed Persona:** A lower-friction option.
- **Enterprise:** Big organizations with roles, spend approvals, and institutional
  regulations.
- **Agent:** How do we set them up for success, ensuring they have what they need to grow
  and evolve?

Developers get to experiment and use our SDK to offer this seamless experience universal
to all Midnight applications.

### 5. User Experience Blueprint

You open a DApp, you do what you are accustomed to in the Web2 world: you use your Face ID
or passkeys. You're not seeing a seed phrase.

Then you have an alias, and that alias is going to help you manage the different addresses
available to you. Behind the scenes, Midnight has your desk address, your unshielded, and
your shielded address. You don't have to worry about them because you have an alias. We're
going to manage Ethereum and Bitcoin addresses for you too, so cross-chain works
seamlessly.

We want account creation to take less than 60 seconds, and your first transaction to be
done in less than 2 minutes.

### 6. Identity, Privacy, and Recovery

For identities, we have DIDs (Decentralized Identifiers), so we have our Midnight DID. We
also have the concept of credentialing. If a DApp requires me to prove that I am an
accredited investor or over 18, we can provide this information following the principle of
proving the minimum without revealing everything.

If you lose your device, you can revoke and continue using your account. We're exploring
various ways for recovery, including social recovery with other participants involved,
backing up with cloud services securely, etc. It ensures total loss recovery without having
a seed phrase.

### 7. Agentic Commerce Market Data

There's a lot of movement in the agentic commerce space. The Explorer 2 initiative and
foundation started less than a year ago, and so far they've processed 160 million payments
from agents. That's significant growth.

There are two things missing right now:

- **Principal Privacy:** The agent proves it is authorized by a real human being and has a
  defined scope of system usage (spending limits, duration).
- **Legal Compliance:** Ensuring agent transactions comply with the legal context.

The flow works like this: First, they sign a mandate that gives them the scope (e.g., a
DeFi agent budget is $10,000). Then the agent proves it's my agent without publishing my
identity on-chain. The requests are evaluated against the pact: if it's in scope, it
settles; if out of scope, it's rejected.

### 8. Technical Deep Dive and Demo (Hector)

Hector: Hello guys, how are you? I have good news and bad news. The good news is Carmel
killed it, the content was amazing. Bad news is I cannot share my screen due to Discord
issues. But we recorded a video and have the presentation, so we will continue with the
demo.

When you use Midnight Passport, three core things happen:

1. **Account Setup:** You get into a UI, no seed phrase, no password. You use passkeys
   (fingerprint on your phone or browser). That contains a cryptographic element that
   allows you to sign transactions and protects your account.
2. **On-chain Infrastructure:** Midnight automatically sets up a compact smart contract
   instance that holds your identity, manages different keys from different devices, and
   handles app permissions.
3. **Asset Management:** You get a chain-abstraction experience where assets flow into this
   account custody contract with all the security Midnight provides.

Instead of using complex addresses, you claim your name (e.g., hector.night, charles.night).
For developers, instead of learning fragmented wallet specifications, you can just use the
Midnight Passport SDK, which gives you bridging, account setup, and recovery out of the box.

### 9. Credentialing and Closing Q&A

Another powerful value proposition is credentialing. You can issue verified credentials
on-chain where you can attest and get verified without disclosing raw information thanks to
zero-knowledge proofs (selective disclosure). Your credential is stored securely in your
device.

**Question from Audience (Max/Fox):** Is there any susceptibility to hacking that exists
today for this passport data?

**Charles Hoskinson:** There's always susceptibility; any system can be hacked. It comes
down to failure modes and balancing the CIA triad (Confidentiality, Integrity,
Availability). The cell phone has given us biometrics and trusted execution hardware.
Passport uses these as building blocks, adds cryptography, and puts the user in the
driver's seat.

We want to get to a benchmark where from when you hear about it to when you are running, it
takes 1 minute. We also treat agents as first-class citizens. Agents are unlikely to be
fooled by an impersonated phishing DApp because agents verify signatures and cryptographic
proofs, whereas humans just misread characters. ZK technology provides provability of
intention.

Another feature Midnight can do because of abstraction is contingent settlement. As a
business, you don't want to just blindly take people's money; you need an audit trail. They
send a transaction, and instead of settling, it goes to "pending" until specific criteria
(ZK proofs, contract signatures) are satisfied.

Carmel: Thank you so much for your time. You know where to find us on Discord to
collaborate and give feedback.

---

## ДОКУМЕНТ 2: РУССКИЙ ПЕРЕВОД (RUSSIAN)

**Название:** Презентация продукта Midnight Passport и технический разбор
**Ссылки на источники:** p1.mp3, p2.mp3, p3.mp3, p4.mp3

### 1. Введение от Чарльза Хоскинсона

Passport — это первый созданный нами продукт, у которого будет миллиард пользователей. Так
что никакого давления. Но этот продукт давно назрел, это недостающий элемент для всей
экосистемы криптовалют. Он привносит простоту и безопасность, необходимые для массового
внедрения.

Я очень рад, что над ним работает звездная команда. Кармел — прекрасный руководитель
продукта, и ее поддерживают Ark и одни из самых блестящих криптографов на планете. Для нас
в Midnight это продукт первоочередной важности (Tier 1).

Вы, ребята из Night Force, станете тем самым авангардом, который первым укажет на наши
ошибки. Насколько бы умны мы ни были, никто не может быть умнее сообщества. Вы найдете
массу способов сломать его, улучшить и поднять на новый уровень. Так же, как это было с
Decrypt, Midnight City и, надеюсь, скоро с Offer Files, вы выступаете в роли бета-тестеров.

Я хотел убедиться, что мы зарезервируем место на наших технических сессиях, чтобы
познакомить всех вас с людьми, создающими реальные вещи, которые окажут значимое и весомое
влияние на развитие Midnight. Чтобы у вас была возможность увидеть это, понять и, надеюсь,
задать вопросы, а в долгосрочной перспективе — помочь команде протестировать продукт перед
выходом на следующий этап.

Без лишних слов я передаю слово Кармел, чтобы она рассказала об истоках проекта и показала
то, что у нее есть.

### 2. Контекст продукта и рыночные тренды (Кармел)

Прекрасно, я с удовольствием введу вас в курс дела. Со мной сегодня Гектор, который
проведет фактическую техническую демонстрацию, подготовленную нашей командой, но я начну с
контекста нашей работы. Позвольте мне на секунду включить демонстрацию экрана.

Когда мы думаем о Passport, прежде всего, с точки зрения продукта, мы смотрим на
существующие пробелы и на то, что происходит в индустрии. Мы выделяем три текущих тренда:

- **Проблема Web3 на входе (Top-of-Funnel):** Web3 теряет огромное количество
  пользователей из-за барьера на самом первом этапе. Это говорит о том, что механизм
  адаптации (onboarding) сломан. Что-то работает не так, когда нужно показать пользователю
  ту ценность, которую ему дает блокчейн. Это проблема пользовательского опыта (UX),
  кроссчейн-взаимодействия и, возможно, процедур идентификации KYC.
- **Агентский ИИ и коммерция:** Еще один сдвиг, который мы наблюдаем и который набирает
  обороты — это агентский ИИ и агентская коммерция. Мы не можем это игнорировать. Мы
  рассматриваем ИИ-агентов как полноценных цифровых персонажей (персон) — таких же, как мы
  с вами, — которые будут использовать блокчейн, Web3, Web2 технологии и т.д. Для них
  необходимо проектировать сценарии взаимодействия и адаптировать систему под них.
- **Трансформация подходов к идентификации:** Происходят масштабные изменения в сфере
  работы с удостоверениями личности. Биометрическое сканирование уже внедряется в
  аэропортах и множестве других мест. Появляется много нормативных актов и политик вокруг
  цифровой идентификации, сайтов, требующих подтверждения возраста, и т.д.

Если объединить эти три направления, то возникают вопросы: где находятся пробелы и как мы
можем с помощью Passport и наших скрытых технологий устранить их незаметно для
пользователя, не заставляя его проходить сложное обучение?

### 3. Препятствия при адаптации и пользовательское трение

Где именно мы теряем людей, когда дело доходит до адаптации? Допустим, 100% наших
пользователей переходят на DApp (децентрализованное приложение), мы донесли до них ценность,
они заинтересованы и воодушевлены. Но затем они понимают: «Оу, мне нужно подключить
кошелек». Что это вообще значит? «И мне нужна сид-фраза». Зачем? Кто будет это использовать,
кто это запомнит, кто сделает скриншот, скопирует его, и где потом искать этот скриншот и
копию? Мы теряем большую часть пользователей прямо на этом шаге.

Затем, переход к первой транзакции: существуют комиссии за газ; нужно понять, откуда вообще
взять этот актив; если у меня есть актив откуда-то еще, мне все равно нужен определенный газ
для взаимодействия с этой сетью.

Это очень серьезные препятствия для внедрения. Эти сбои накапливаются и блокируют
распространение блокчейн-технологий в целом. Наш подход заключается в том, чтобы решить
проблему не только изолированно для Midnight, но и понять, как взаимодействовать с
пользователями на Ethereum, Solana или Bitcoin с минимальным трением.

Перед нами стоят проблемы сид-фразы, дилеммы идентичности и конфиденциальности,
кроссчейн-совместимости и отсутствия восстановления. Если вы потеряли кошелек или свой
пасскей (passkey), вы больше никогда не получите к нему доступ. И это огромная проблема.

### 4. Архитектурные абстракции и четыре типа персонажей

Абстракции, над которыми мы собираемся работать и которые намерены реализовать, включают в
себя: Создание аккаунта и владение им, Абстракцию аккаунта и Абстракцию цепей (Chain
Abstraction). Мы решаем эти задачи элегантным способом, который позволяет вам
взаимодействовать с сетью и мгновенно получать максимальную выгоду.

Мы выделяем четыре типа персонажей, которые выиграют от внедрения Passport:

- **Физическое лицо (Individual):** Это я, контролирующий свой кошелек и свой аккаунт.
- **Управляемый персонаж (Managed Persona):** Вариант с еще меньшим уровнем трения.
- **Предприятие (Enterprise):** Крупные организации с ролями, механизмами одобрения
  расходов и корпоративными правилами.
- **Агент (Agent):** Как нам обеспечить им условия для успеха, гарантируя, что у них есть
  все необходимое для роста и эволюции?

Разработчики смогут использовать наш SDK для интеграции этого бесшовного опыта, единого для
всех приложений экосистемы Midnight.

### 5. Модель пользовательского опыта (UX)

Вы открываете DApp и делаете то, к чему привыкли в мире Web2: используете Face ID или
пасскеи. Вы не видите сид-фразу и не делаете ничего, что казалось бы чуждым.

Затем у вас появляется алиас (псевдоним), и этот алиас поможет вам управлять различными
доступными вам адресами. За кулисами система создает ваш аккаунт, у вас есть адреса, и
Midnight, например, оперирует вашим desk-адресом, неэкранированным (unshielded) и
экранированным (shielded) адресами. Вам не нужно о них беспокоиться, потому что у вас есть
алиас. Мы также будем управлять адресами Ethereum и Bitcoin для вас, чтобы
кроссчейн-взаимодействие работало прозрачно.

Мы хотим, чтобы создание аккаунта занимало менее 60 секунд, а ваша первая транзакция
выполнялась менее чем за 2 минуты.

### 6. Идентичность, конфиденциальность и восстановление

Для работы с удостоверениями у нас есть децентрализованные идентификаторы (DID), включая наш
Midnight DID. Мы также используем концепцию верификации учетных данных (credentialing). Если
DApp требует от меня подтверждения того, что я являюсь аккредитованным инвестором или мне
больше 18 лет, мы можем предоставить эту информацию, следуя принципу подтверждения минимума
без раскрытия всего остального.

Если вы потеряете устройство, вы сможете отозвать доступ и продолжить использовать свой
аккаунт. Мы изучаем различные способы восстановления, включая социальное восстановление с
привлечением других участников, безопасное резервное копирование в облачные сервисы и т.д.
Это обеспечивает полное восстановление при потере без использования сид-фразы.

### 7. Рыночные данные агентской коммерции

Мы видим огромное движение в сегменте агентской коммерции. Инициатива и фонд Explorer 2
стартовали менее года назад, и к настоящему моменту они обработали 160 миллионов платежей,
совершенных ИИ-агентами. Это значительный показатель роста.

Однако прямо сейчас не хватает двух вещей:

- **Конфиденциальность принципала:** Агент должен доказать, что он авторизован реальным
  человеком, и иметь четко определенные рамки использования системы (лимиты расходов,
  длительность).
- **Правовое соответствие:** Проведение транзакций агентов в полном соответствии с
  юридическим контекстом.

Процесс выглядит так: сначала подписывается мандат, определяющий рамки (например, лимит
DeFi-агента составляет $10 000). Затем агент доказывает, что он принадлежит мне, без
публикации моей личности в ончейне. Запросы оцениваются на соответствие пакту: если они
находятся в рамках лимитов, транзакция проводится; если выходят за рамки — отклоняется.

### 8. Технический разбор и демонстрация (Гектор)

Гектор: Привет, ребята, как дела? У меня есть хорошая и плохая новость. Хорошая новость —
Кармел отлично выступила, материал потрясающий. Плохая новость — я не могу включить
демонстрацию экрана из-за проблем с Discord. Но мы записали видео, и у нас есть презентация,
так что мы продолжим демонстрацию в таком формате.

Когда вы используете Midnight Passport, происходят три основные вещи:

1. **Настройка аккаунта:** Вы попадаете в интерфейс, где нет ни сид-фразы, ни пароля. Вы
   используете пасскеи (отпечаток пальца на телефоне или в браузере). Они содержат
   криптографический элемент, который позволяет вам подписывать транзакции и защищает ваш
   аккаунт.
2. **Ончейн-инфраструктура:** Midnight автоматически разворачивает компактный экземпляр
   смарт-контракта, который хранит вашу идентичность, управляет ключами с разных устройств и
   контролирует разрешения приложений.
3. **Управление активами:** Вы получаете опыт абстракции цепей, при котором активы поступают
   на этот контракт кастодиального хранения со всей безопасностью, которую обеспечивает
   Midnight.

Вместо использования сложных адресов вы заявляете свое имя (например, hector.night,
charles.night). Для разработчиков, вместо изучения разрозненных спецификаций кошельков,
доступен Midnight Passport SDK, дающий механизмы мостов, настройки аккаунта и восстановления
прямо из коробки.

### 9. Верификация данных и заключительная сессия вопросов и ответов

Еще одно мощное ценностное предложение — это верификация данных. Вы можете выпускать
проверяемые учетные данные в ончейне, подтверждая информацию о себе без раскрытия исходных
данных благодаря доказательствам с нулевым разглашением (селективное раскрытие). Ваши данные
безопасно хранятся на вашем устройстве.

**Вопрос из аудитории (Max/Fox):** Существует ли сегодня уязвимость к взлому для данных
такого паспорта?

**Чарльз Хоскинсон:** Уязвимость существует всегда; любую систему можно взломать. Все
сводится к сценариям сбоев, их контролируемости и тому, насколько тщательно сбалансирована
триада CIA (конфиденциальность, целостность, доступность). Мобильный телефон дал нам
биометрию, пин-коды и аппаратную среду доверенного исполнения. Passport использует их как
строительные блоки, добавляет криптографию и передает управление в руки пользователя.

Мы хотим выйти на показатель, когда с момента, как вы узнали о продукте, до момента, когда
вы его запустили, проходит 1 минута. Мы также относимся к ИИ-агентам как к полноправным
участникам системы. Агентов вряд ли удастся обмануть фишинговым приложением, симулирующим
реальный интерфейс, потому что агенты проверяют подписи и криптографические доказательства, в
то время как люди просто невнимательно читают символы. Концепция ZK обеспечивает доказуемость
намерений.

Еще одна функция, которую Midnight может выполнять благодаря абстракции — это условный расчет
(contingent settlement). Если вы представляете бизнес, вы не хотите просто вслепую принимать
деньги пользователей. Вам необходим аудиторский след и подтверждение того, почему вы взяли
деньги и каковы контрактные соглашения. Они отправляют вам транзакцию, и вместо немедленного
расчета она переходит в статус «ожидание», пока не будут выполнены определенные критерии
(ZK-доказательства, подписи контрактов).

Кармел: Большое спасибо за ваше время. Вы знаете, где найти нас в Discord для совместной
работы и обратной связи.
