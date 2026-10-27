/* Bordões da provocação (item 2). Quem escreve é o dono: cada frase entra exatamente como ele mandou.
   Lutador sem frase aprovada usa o balão neutro "!!". */
(function(root){
 var falas={
  nutri:'aí que ódio!',lutador:'Lá ele!',emanuelly:'posso ler minha redação?',enzo:'',pedro:'quem refresca bunda de pato é lagoa',naju:'Bando de chatos!',grazi:'',bispo:'',lohan:'',rafinha:'',
  douglas:'',fidelis:'',arthur:'',lucas:'',duda:'',cardoso:'',th:'',douglinhas:'',ricardo:'',adriene:''
 };
 // frase especial contra um adversário certo: contra[quem][adversário]
 var contra={
  nutri:{lutador:'oii meu carequinha!'},
  lutador:{fidelis:'que play. Rapeize!',pedro:'que play. Rapeize!',rafinha:'que play. Rapeize!',nutri:'oii minha gorilinha!'},
  emanuelly:{nutri:'Olá, chatonilda',lutador:'E aí, cunhado!'},
  enzo:{lutador:'e aí, irmão!',grazi:'opa!'},
  pedro:{naju:'ola, gatinha!'},
  naju:{pedro:'oii amor!'}
 };
 var api={falas:falas,contra:contra,fala:function(who,rival){return contra[who]&&contra[who][rival]||falas[who]||'!!';}};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Bordoes=api;
}(typeof window!=='undefined'?window:globalThis));
