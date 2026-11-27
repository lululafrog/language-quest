// Original short dialogues written for Fluent30 (listening, dictation, shadowing).
import type { Dialogue } from "./types";

export const DIALOGUES: Dialogue[] = [
  {
    id: "coffee-order", title: "At the coffee shop", titleFr: "Au café", level: "A1", theme: "restaurant",
    lines: [
      { speaker: "A", en: "Hi! What can I get you?", fr: "Bonjour ! Qu'est-ce que je vous sers ?" },
      { speaker: "B", en: "Can I have a large latte, please?", fr: "Je peux avoir un grand latte, s'il vous plaît ?" },
      { speaker: "A", en: "Sure. Anything to eat?", fr: "Bien sûr. Quelque chose à manger ?" },
      { speaker: "B", en: "Yes, a croissant, please.", fr: "Oui, un croissant, s'il vous plaît." },
      { speaker: "A", en: "That's six fifty.", fr: "Ça fait six cinquante." },
      { speaker: "B", en: "Here you go. Thanks!", fr: "Voilà. Merci !" },
    ],
  },
  {
    id: "meeting", title: "Nice to meet you", titleFr: "Enchanté", level: "A1", theme: "daily",
    lines: [
      { speaker: "A", en: "Hi, I'm Tom. What's your name?", fr: "Salut, je suis Tom. Comment tu t'appelles ?" },
      { speaker: "B", en: "I'm Léa. Nice to meet you.", fr: "Je suis Léa. Enchantée." },
      { speaker: "A", en: "Nice to meet you too. Where are you from?", fr: "Enchanté aussi. Tu viens d'où ?" },
      { speaker: "B", en: "I'm from Lyon, in France. And you?", fr: "Je viens de Lyon, en France. Et toi ?" },
      { speaker: "A", en: "I'm from Manchester. Do you like it here?", fr: "Je viens de Manchester. Ça te plaît ici ?" },
      { speaker: "B", en: "Yes, I love it. The people are really friendly.", fr: "Oui, j'adore. Les gens sont vraiment sympas." },
    ],
  },
  {
    id: "directions", title: "Asking for directions", titleFr: "Demander son chemin", level: "A1", theme: "travel",
    lines: [
      { speaker: "A", en: "Excuse me, where's the train station?", fr: "Excusez-moi, où est la gare ?" },
      { speaker: "B", en: "Go straight on and turn left at the lights.", fr: "Allez tout droit et tournez à gauche au feu." },
      { speaker: "A", en: "Is it far?", fr: "C'est loin ?" },
      { speaker: "B", en: "No, it's about five minutes on foot.", fr: "Non, c'est à environ cinq minutes à pied." },
      { speaker: "A", en: "Great, thank you so much.", fr: "Super, merci beaucoup." },
      { speaker: "B", en: "No problem. Have a good day!", fr: "Pas de problème. Bonne journée !" },
    ],
  },
  {
    id: "shopping-size", title: "Trying on clothes", titleFr: "Essayer des vêtements", level: "A2", theme: "shopping",
    lines: [
      { speaker: "A", en: "Hi, can I try this jacket on?", fr: "Bonjour, je peux essayer cette veste ?" },
      { speaker: "B", en: "Of course. The changing rooms are over there.", fr: "Bien sûr. Les cabines sont là-bas." },
      { speaker: "A", en: "It's a bit too small. Do you have it in a medium?", fr: "Elle est un peu trop petite. Vous l'avez en M ?" },
      { speaker: "B", en: "Let me check. Yes, here you are.", fr: "Je vérifie. Oui, tenez." },
      { speaker: "A", en: "Perfect, it fits. How much is it?", fr: "Parfait, elle me va. Elle coûte combien ?" },
      { speaker: "B", en: "It's forty pounds, but it's twenty percent off today.", fr: "Quarante livres, mais il y a vingt pour cent de réduction aujourd'hui." },
    ],
  },
  {
    id: "weekend", title: "What did you do at the weekend?", titleFr: "Ton week-end ?", level: "A2", theme: "daily",
    lines: [
      { speaker: "A", en: "Hey! How was your weekend?", fr: "Salut ! C'était comment ton week-end ?" },
      { speaker: "B", en: "Really good, thanks. I went hiking with some friends.", fr: "Vraiment bien, merci. Je suis allé(e) randonner avec des amis." },
      { speaker: "A", en: "Oh nice! Where did you go?", fr: "Oh sympa ! Vous êtes allés où ?" },
      { speaker: "B", en: "We drove to the Lake District. The views were amazing.", fr: "On a roulé jusqu'au Lake District. Les paysages étaient incroyables." },
      { speaker: "A", en: "Lucky you. I just stayed at home and watched films.", fr: "Quelle chance. Moi je suis juste resté(e) chez moi à regarder des films." },
      { speaker: "B", en: "That sounds pretty good too, to be honest.", fr: "Ça a l'air pas mal aussi, pour être honnête." },
    ],
  },
  {
    id: "doctor", title: "At the doctor's", titleFr: "Chez le médecin", level: "A2", theme: "health",
    lines: [
      { speaker: "A", en: "So, what seems to be the problem?", fr: "Alors, qu'est-ce qui ne va pas ?" },
      { speaker: "B", en: "I've had a sore throat and a headache since Monday.", fr: "J'ai mal à la gorge et à la tête depuis lundi." },
      { speaker: "A", en: "Have you got a temperature?", fr: "Vous avez de la fièvre ?" },
      { speaker: "B", en: "A little, yes. And I feel really tired.", fr: "Un peu, oui. Et je me sens très fatigué(e)." },
      { speaker: "A", en: "It's probably a virus. Get some rest and drink plenty of water.", fr: "C'est sans doute un virus. Reposez-vous et buvez beaucoup d'eau." },
      { speaker: "B", en: "Okay. Should I take anything for the pain?", fr: "D'accord. Je dois prendre quelque chose contre la douleur ?" },
      { speaker: "A", en: "Paracetamol is fine. Come back if you're not better in a week.", fr: "Du paracétamol suffit. Revenez si ça ne va pas mieux dans une semaine." },
    ],
  },
  {
    id: "hotel-checkin", title: "Checking in", titleFr: "L'arrivée à l'hôtel", level: "A2", theme: "travel",
    lines: [
      { speaker: "A", en: "Good evening. Do you have a reservation?", fr: "Bonsoir. Vous avez une réservation ?" },
      { speaker: "B", en: "Yes, it's under the name Martin. Two nights.", fr: "Oui, au nom de Martin. Deux nuits." },
      { speaker: "A", en: "Here it is. Could I see your passport, please?", fr: "La voilà. Je peux voir votre passeport, s'il vous plaît ?" },
      { speaker: "B", en: "Sure. What time is breakfast?", fr: "Bien sûr. Le petit-déjeuner est à quelle heure ?" },
      { speaker: "A", en: "From seven to ten, on the ground floor.", fr: "De sept à dix heures, au rez-de-chaussée." },
      { speaker: "B", en: "And is there Wi-Fi in the room?", fr: "Et il y a le Wi-Fi dans la chambre ?" },
      { speaker: "A", en: "Yes, the password is on your key card. Enjoy your stay!", fr: "Oui, le mot de passe est sur votre carte. Bon séjour !" },
    ],
  },
  {
    id: "flatmate", title: "The new flatmate", titleFr: "Le nouveau colocataire", level: "B1", theme: "home",
    lines: [
      { speaker: "A", en: "So, this is your room. It's not huge, but it gets loads of light.", fr: "Voilà ta chambre. Elle n'est pas immense, mais elle est très lumineuse." },
      { speaker: "B", en: "I love it. How do you guys split the bills?", fr: "Je l'adore. Vous partagez les factures comment ?" },
      { speaker: "A", en: "We just divide everything by three and pay it at the end of the month.", fr: "On divise tout par trois et on paie à la fin du mois." },
      { speaker: "B", en: "Sounds fair. Is there a cleaning rota or anything?", fr: "Ça me paraît juste. Il y a un planning de ménage ?" },
      { speaker: "A", en: "Yeah, it's on the fridge. We take turns every week.", fr: "Oui, il est sur le frigo. On se relaie chaque semaine." },
      { speaker: "B", en: "Cool. When can I move in?", fr: "Cool. Je peux emménager quand ?" },
      { speaker: "A", en: "Whenever you like, really. The room's free from Saturday.", fr: "Quand tu veux, vraiment. La chambre est libre à partir de samedi." },
    ],
  },
  {
    id: "lost-luggage", title: "Lost luggage", titleFr: "Bagage perdu", level: "B1", theme: "airport",
    lines: [
      { speaker: "A", en: "Hi, my suitcase didn't come out on the belt.", fr: "Bonjour, ma valise n'est pas sortie sur le tapis." },
      { speaker: "B", en: "I'm sorry to hear that. Can I see your boarding pass?", fr: "Désolé(e) de l'apprendre. Je peux voir votre carte d'embarquement ?" },
      { speaker: "A", en: "Here you go. I had a connection in Frankfurt.", fr: "Tenez. J'avais une correspondance à Francfort." },
      { speaker: "B", en: "It looks like it's still there. It should arrive on tomorrow's flight.", fr: "Apparemment elle y est encore. Elle devrait arriver avec le vol de demain." },
      { speaker: "A", en: "Tomorrow? But all my stuff is in there.", fr: "Demain ? Mais toutes mes affaires sont dedans." },
      { speaker: "B", en: "I understand. We can deliver it to your hotel, and you can claim for essentials.", fr: "Je comprends. On peut la livrer à votre hôtel, et vous pouvez vous faire rembourser le nécessaire." },
      { speaker: "A", en: "Okay, that helps. Do I need to keep the receipts?", fr: "D'accord, ça aide. Je dois garder les tickets ?" },
      { speaker: "B", en: "Yes, keep every receipt and send them to us with this form.", fr: "Oui, gardez tous les tickets et envoyez-les-nous avec ce formulaire." },
    ],
  },
  {
    id: "job-chat", title: "Talking about work", titleFr: "Parler du travail", level: "B1", theme: "work",
    lines: [
      { speaker: "A", en: "So what do you do for a living?", fr: "Alors, tu fais quoi dans la vie ?" },
      { speaker: "B", en: "I work in marketing for a small tech company.", fr: "Je travaille dans le marketing pour une petite boîte tech." },
      { speaker: "A", en: "Do you enjoy it?", fr: "Ça te plaît ?" },
      { speaker: "B", en: "Most of the time. The team's great, but I'm swamped at the moment.", fr: "La plupart du temps. L'équipe est super, mais je suis débordé(e) en ce moment." },
      { speaker: "A", en: "I know the feeling. Have you been there long?", fr: "Je connais. Tu y es depuis longtemps ?" },
      { speaker: "B", en: "About three years. I'm thinking of looking for something new, though.", fr: "Environ trois ans. Mais je pense chercher autre chose." },
    ],
  },
  {
    id: "restaurant-complaint", title: "A small complaint", titleFr: "Une petite réclamation", level: "B1", theme: "restaurant",
    lines: [
      { speaker: "A", en: "Is everything all right with your meal?", fr: "Tout se passe bien avec votre repas ?" },
      { speaker: "B", en: "Actually, I ordered the steak medium, but it's quite rare.", fr: "En fait, j'ai commandé le steak à point, mais il est assez saignant." },
      { speaker: "A", en: "Oh, I'm so sorry about that. I'll take it back to the kitchen.", fr: "Oh, je suis vraiment désolé(e). Je le ramène en cuisine." },
      { speaker: "B", en: "Thanks. No rush, it's not a big deal.", fr: "Merci. Rien ne presse, ce n'est pas grave." },
      { speaker: "A", en: "It'll be about five minutes. Can I get you another drink in the meantime?", fr: "Ça prendra environ cinq minutes. Je vous apporte un autre verre en attendant ?" },
      { speaker: "B", en: "That would be lovely, thank you.", fr: "Ce serait parfait, merci." },
    ],
  },
  {
    id: "plans-trip", title: "Planning a trip", titleFr: "Préparer un voyage", level: "B1", theme: "travel",
    lines: [
      { speaker: "A", en: "Have you decided where you're going this summer?", fr: "Tu as décidé où tu vas cet été ?" },
      { speaker: "B", en: "I'm going to Scotland for two weeks. I've already booked the flights.", fr: "Je vais en Écosse pour deux semaines. J'ai déjà réservé les vols." },
      { speaker: "A", en: "Amazing. Are you going to rent a car?", fr: "Génial. Tu vas louer une voiture ?" },
      { speaker: "B", en: "I think so. I'd like to drive up to the Highlands.", fr: "Je pense. J'aimerais monter jusqu'aux Highlands." },
      { speaker: "A", en: "Just remember they drive on the left!", fr: "N'oublie pas qu'ils roulent à gauche !" },
      { speaker: "B", en: "I know, that's what I'm worried about.", fr: "Je sais, c'est bien ce qui m'inquiète." },
    ],
  },
  {
    id: "first-date", title: "A first date", titleFr: "Un premier rendez-vous", level: "B2", theme: "dating",
    lines: [
      { speaker: "A", en: "I have to admit, I was a bit nervous about tonight.", fr: "Je dois avouer que j'étais un peu nerveux/nerveuse pour ce soir." },
      { speaker: "B", en: "Me too, honestly. But this is going really well, isn't it?", fr: "Moi aussi, franchement. Mais ça se passe très bien, non ?" },
      { speaker: "A", en: "It is. So tell me, what made you swipe right?", fr: "Oui. Alors dis-moi, qu'est-ce qui t'a donné envie de matcher ?" },
      { speaker: "B", en: "Your photo with the dog, obviously. Is he yours?", fr: "Ta photo avec le chien, évidemment. C'est le tien ?" },
      { speaker: "A", en: "He's my sister's, but I borrow him whenever I can.", fr: "C'est celui de ma sœur, mais je l'emprunte dès que je peux." },
      { speaker: "B", en: "Smart move. Well, I'd love to meet him one day.", fr: "Bien joué. Eh bien, j'adorerais le rencontrer un jour." },
      { speaker: "A", en: "Is that your way of asking for a second date?", fr: "C'est ta façon de demander un deuxième rendez-vous ?" },
      { speaker: "B", en: "Maybe it is.", fr: "Peut-être bien." },
    ],
  },
  {
    id: "remote-work", title: "Working from home", titleFr: "Le télétravail", level: "B2", theme: "work",
    lines: [
      { speaker: "A", en: "Are you still working from home most days?", fr: "Tu télétravailles toujours la plupart du temps ?" },
      { speaker: "B", en: "Three days a week. I go into the office on Tuesdays and Thursdays.", fr: "Trois jours par semaine. Je vais au bureau le mardi et le jeudi." },
      { speaker: "A", en: "Don't you find it hard to switch off at the end of the day?", fr: "Tu ne trouves pas ça dur de décrocher le soir ?" },
      { speaker: "B", en: "I used to, but now I shut my laptop at six, no matter what.", fr: "Avant oui, mais maintenant je ferme mon ordi à six heures, quoi qu'il arrive." },
      { speaker: "A", en: "That's sensible. I end up answering emails until midnight.", fr: "C'est raisonnable. Moi je finis par répondre aux mails jusqu'à minuit." },
      { speaker: "B", en: "You should set some boundaries, or you'll burn out.", fr: "Tu devrais poser des limites, sinon tu vas faire un burn-out." },
    ],
  },
  {
    id: "flat-problem", title: "Calling the landlord", titleFr: "Appeler le propriétaire", level: "B2", theme: "home",
    lines: [
      { speaker: "A", en: "Hi, it's Julie from flat 4. I'm afraid the boiler's packed up again.", fr: "Bonjour, c'est Julie de l'appartement 4. J'ai bien peur que la chaudière soit encore en panne." },
      { speaker: "B", en: "Oh no, not again. Have you tried resetting it?", fr: "Oh non, encore. Vous avez essayé de la réinitialiser ?" },
      { speaker: "A", en: "Twice. It comes on for a minute and then cuts out.", fr: "Deux fois. Elle se rallume une minute puis s'arrête." },
      { speaker: "B", en: "Right, I'll get an engineer to come round first thing tomorrow.", fr: "Bon, je fais venir un technicien demain à la première heure." },
      { speaker: "A", en: "Thanks. It's freezing in here, to be honest.", fr: "Merci. Il fait glacial ici, pour être honnête." },
      { speaker: "B", en: "I'm sorry. If it can't be fixed, I'll replace it. You shouldn't have to put up with this.", fr: "Je suis désolé. Si elle n'est pas réparable, je la remplacerai. Vous ne devriez pas avoir à supporter ça." },
    ],
  },
  {
    id: "news-debate", title: "Should cars be banned from city centres?", titleFr: "Faut-il interdire les voitures en ville ?", level: "C1", theme: "daily",
    lines: [
      { speaker: "A", en: "Did you see they're planning to ban cars from the city centre altogether?", fr: "Tu as vu qu'ils prévoient d'interdire complètement les voitures dans le centre ?" },
      { speaker: "B", en: "I did. I'm all for it, to be honest. The air quality is dreadful.", fr: "Oui. Je suis complètement pour, honnêtement. La qualité de l'air est épouvantable." },
      { speaker: "A", en: "Sure, but what about people who can't rely on public transport?", fr: "D'accord, mais quid des gens qui ne peuvent pas compter sur les transports en commun ?" },
      { speaker: "B", en: "That's a fair point. There'd have to be exemptions, for disabled drivers at the very least.", fr: "C'est juste. Il faudrait des dérogations, au minimum pour les conducteurs handicapés." },
      { speaker: "A", en: "And local businesses are bound to take a hit, at least at first.", fr: "Et les commerces locaux vont forcément en pâtir, du moins au début." },
      { speaker: "B", en: "Maybe, though studies tend to show footfall actually goes up once streets are pedestrianised.", fr: "Peut-être, même si les études tendent à montrer que la fréquentation augmente une fois les rues piétonnisées." },
    ],
  },
  {
    id: "career-change", title: "A career change", titleFr: "Une reconversion", level: "C1", theme: "work",
    lines: [
      { speaker: "A", en: "I heard you handed in your notice. What brought that on?", fr: "J'ai appris que tu avais posé ta démission. Qu'est-ce qui t'a poussé(e) à ça ?" },
      { speaker: "B", en: "I'd been toying with the idea for ages. I just felt I'd hit a ceiling.", fr: "J'y pensais depuis des lustres. J'avais l'impression d'avoir atteint un plafond." },
      { speaker: "A", en: "Fair enough. So what's next?", fr: "Ça se comprend. Et maintenant ?" },
      { speaker: "B", en: "I'm retraining as a carpenter, believe it or not.", fr: "Je me reconvertis en menuisier, crois-le ou non." },
      { speaker: "A", en: "Seriously? That's quite a leap from accountancy.", fr: "Sérieux ? C'est un sacré saut depuis la comptabilité." },
      { speaker: "B", en: "It is, but I'd rather take the plunge now than spend the next twenty years wondering what if.", fr: "Oui, mais je préfère me lancer maintenant que passer vingt ans à me demander « et si »." },
    ],
  },
  {
    id: "sport-match", title: "Watching the match", titleFr: "Regarder le match", level: "B1", theme: "sport",
    lines: [
      { speaker: "A", en: "Are you coming to watch the match tonight?", fr: "Tu viens regarder le match ce soir ?" },
      { speaker: "B", en: "Definitely. Who are we playing?", fr: "Carrément. On joue contre qui ?" },
      { speaker: "A", en: "Liverpool. It's going to be tough.", fr: "Liverpool. Ça va être dur." },
      { speaker: "B", en: "We beat them last season, didn't we?", fr: "On les a battus la saison dernière, non ?" },
      { speaker: "A", en: "Yeah, but half our team is injured now.", fr: "Oui, mais la moitié de notre équipe est blessée maintenant." },
      { speaker: "B", en: "Well, fingers crossed. I'll bring some snacks.", fr: "Bon, croisons les doigts. J'apporte de quoi grignoter." },
    ],
  },
];

export function dialogueById(id: string) {
  return DIALOGUES.find((d) => d.id === id);
}
