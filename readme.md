```
 _____ _                _   __                          
|_   _(_)              | | / /                          
  | |  _ _ __ ___   ___| |/ /  ___  ___ _ __   ___ _ __ 
  | | | | '_ ` _ \ / _ \    \ / _ \/ _ \ '_ \ / _ \ '__|
  | | | | | | | | |  __/ |\  \  __/  __/ |_) |  __/ |   
  \_/ |_|_| |_| |_|\___\_| \_/\___|\___| .__/ \___|_|   
                                       | |              
                                       |_|              

```

L'application gère :
- Afficher un composant "chronomètre"
- Se synchroniser avec l'API des /timers
- Lister les temps : sous forme d'un graphique circulaire
- Afficher le temps de travail total de l'utilisateur sur la journée.
- PWA
- Offline
- I18N : très partiellement, l'interfaçage avec material angular n'est par exemple pas fait...

Au début du projet j'ai fait un petit serveur back qu'on peut trouver dans le dossier back et qui m'a permis
de simuler facilement des erreurs, de la latence etc.

Pour lancer le projet en mode pwa, il faut lancer la commande `npm run build-pwa`
cette commande lance un serveur http via l'utilitaire http-server, qui fait un proxy vers les appels à l'api
pour eviter d'avoir des problèmes de cors, et elle fournit également un certif auto signé pour faire
du https. Vous pouvez ajouter le certif à la session, ou alors cliquer sur "continuer quand meme" dans chrome
ca doit marcher aussi.

Pour aller plus loin j'aurais aimé entre autre faire quelques tests automatisés mais n'ai malheureusement pas eu le temps
de m'en occuper.

Bonne code review :)



