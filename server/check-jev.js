'use strict';
// Mostra somente diagnósticos permitidos: nunca chave, corpo externo ou erro bruto.
const {createJev}=require('./jev');
function failureMessage(result){
 const d=result.diagnostic||{};
 if(d.reason==='missing_key')return 'Configure a chave com bash configurar-jev.sh.';
 if(d.reason==='timeout')return 'O Jev não respondeu em '+d.timeoutMs+' ms. A validação inicial expirou; a publicação não foi iniciada.';
 if(d.reason==='network')return ['EAI_AGAIN','ENOTFOUND'].includes(d.code)?'Falha de DNS ao resolver api.typesafe.ai ('+d.code+'). Não foi possível verificar a chave.':'Não foi possível conectar à API do Jev'+(d.code?' ('+d.code+')':'')+'. A chave não pôde ser validada.';
 if(d.reason==='upstream_http'){
  if(d.httpStatus===401)return 'Jev recusou a autenticação (HTTP 401). Confira a chave privada.';
  if(d.httpStatus===402)return 'Jev retornou HTTP 402. Confira a cobrança/créditos da conta TypeSafe.';
  if(d.httpStatus===403)return 'Jev recusou o acesso (HTTP 403). Confira as permissões da conta/chave.';
  if(d.httpStatus===429)return 'Jev limitou a chamada (HTTP 429). Aguarde antes de tentar novamente.';
  return 'Jev respondeu HTTP '+d.httpStatus+'. A publicação não foi iniciada.';
 }
 if(['invalid_json','invalid_answer','response_too_large'].includes(d.reason))return 'Jev respondeu em um formato incompatível com a integração ('+d.reason+'). A publicação não foi iniciada.';
 return 'Jev não confirmou a conexão. A publicação não foi iniciada.';
}
async function check(options={}){
 // A partida continua com timeout de 1,5s; só a ativação tolera até 10s.
 const service=options.service||createJev({timeoutMs:10000}),log=options.log||console.log;
 if(!service.status().enabled)throw new Error('Configure a chave com bash configurar-jev.sh.');
 const result=await service.decide({mode:'x1',actors:[{kind:'fighter',character:'ricardo',difficulty:'medio',health:1,opponentHealth:1,distance:250,primaryReady:true,secondaryReady:true,specialReady:false,guardReady:true,guardEnergy:1}]},'activation');
 if(result.status!==200||!(result.body.choices&&result.body.choices.actor0)&&!(result.diagnostic&&result.diagnostic.reason==='low_confidence'&&result.diagnostic.validAnswers>0))throw new Error(failureMessage(result));
 log(result.diagnostic&&result.diagnostic.reason==='low_confidence'?'Jev autenticou e respondeu corretamente. Nesta decisão de baixa confiança, o jogo mantém a IA local.':'Jev respondeu com uma decisão válida. Credencial mantida privada.');
}
if(require.main===module)check().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={check,failureMessage};
