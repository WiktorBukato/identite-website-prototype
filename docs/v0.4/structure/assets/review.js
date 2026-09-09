'use strict';
// Contact and self-review use page memory; locale.js performs a one-use same-tab handoff. No network writes.
const contactControllers = new WeakMap();
document.querySelectorAll('[data-contact]').forEach(contactForm => {
  const config=JSON.parse(contactForm.dataset.contact),copy=config.messages;
  const parameters=new URLSearchParams(location.search),context={};
  const lists={interaction:config.interactions,intent:Object.keys(copy.intents),product:config.products,solution:config.solutions,source_page:config.routes,locale:config.locales};
  for(const [key,allowed] of Object.entries(lists)){const value=parameters.get(key);if(allowed.includes(value))context[key]=value;}
  const safeQuery=new URLSearchParams(context).toString();
  if(location.search)history.replaceState(null,'',location.pathname+(safeQuery?'?'+safeQuery:'')+location.hash);
  const intent=contactForm.elements.intent;
  intent.value=context.intent||'general';
  const status=contactForm.querySelector('[data-form-status]'),preview=contactForm.querySelector('[data-request-preview]'),output=contactForm.querySelector('[data-request-text]');
  const draft=contactForm.querySelector('[data-email-draft]'),help=contactForm.querySelector('[data-email-help]');
  const choice=contactForm.querySelector('[data-brief-choice]');
  let subject='',pendingBrief;
  // Preserve legacy enum URLs while giving request data explicit semantic dimensions.
  function requestContext(){
    const {solution,...selected}=context;
    if(solution)selected[copy.contextKinds[solution]]=solution;
    return selected;
  }
  function invalidate(){preview.hidden=true;output.value='';draft.removeAttribute('href');help.textContent='';status.textContent='';}
  function updateContext(){
    context.intent=intent.value;
    const details=[copy.intents[intent.value],copy.names[context.product],copy.names[context.solution]].filter(Boolean);
    subject=details.join(' — ');
    contactForm.querySelector('[data-request-context]').textContent=copy.context+': '+subject;
  }
  function syncSelectedContext(){
    const query=new URLSearchParams(Object.entries(context).filter(([key,value])=>lists[key]?.includes(value))).toString();
    history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);
  }
  intent.addEventListener('change',()=>{updateContext();invalidate();});updateContext();
  contactForm.addEventListener('input',invalidate);
  contactForm.addEventListener('submit',event=>{
    event.preventDefault();invalidate();let invalid;
    contactForm.querySelectorAll('input,textarea:not([readonly])').forEach(field=>{
      const valid=field.validity.valid&&(!field.required||field.value.trim().length>0);
      field.setAttribute('aria-invalid',String(!valid));field.setAttribute('aria-describedby','error-'+field.name);
      const error=contactForm.querySelector('#error-'+field.name);
      if(error)error.textContent=valid?'':field.validity.typeMismatch?copy.invalidEmail:copy.required;
      if(!valid&&!invalid)invalid=field;
    });
    if(invalid){status.textContent=copy.invalid;invalid.focus();return;}
    const lines=[contactForm.querySelector('[data-request-context]').textContent,...Object.entries(requestContext()).filter(([k])=>k!=='intent').map(([k,v])=>copy.contextLabels[k]+': '+v)];
    for(const [key,label] of Object.entries(copy.labels)){const value=contactForm.elements[key].value.trim();if(value)lines.push(label+': '+value);}
    output.value=lines.join('\n');
    const email='mailto:'+copy.emailAddress+'?subject='+encodeURIComponent(subject);
    const full=email+'&body='+encodeURIComponent(output.value);
    // Conservative handoff budget, not a claim of universal mail-client support.
    const long=full.length>copy.mailtoBudget;
    draft.href=long?email:full;draft.textContent=long?copy.emailFallback:copy.email;
    help.textContent=long?copy.longEmail:copy.emailHelp;
    preview.hidden=false;status.textContent=copy.notSent;
  });
  contactForm.querySelector('[data-copy-request]').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(output.value);status.textContent=copy.copied;}
    catch{output.focus();output.select();status.textContent=copy.copyFallback;}
  });
  function commitBrief(){
    if(!pendingBrief)return;
    const {text,selected}=pendingBrief;
    const message=contactForm.elements.message;
    // The route determines the experience, never an inferred industry.
    delete context.product;delete context.interaction;
    Object.assign(context,selected);
    message.value=message.value ? message.value+'\n\n'+text : text;
    pendingBrief=undefined;choice.hidden=true;updateContext();syncSelectedContext();invalidate();
    status.textContent=copy.briefAdded;message.focus();
  }
  contactForm.querySelector('[data-append-brief]').addEventListener('click',commitBrief);
  contactForm.querySelector('[data-cancel-brief]').addEventListener('click',()=>{pendingBrief=undefined;choice.hidden=true;contactForm.elements.message.focus();});
  contactControllers.set(contactForm,{
    apply(text,selected){
      pendingBrief={text,selected};
      if(contactForm.elements.message.value){choice.hidden=false;choice.querySelector('button').focus();}
      else commitBrief();
    },
    cancelPending(){pendingBrief=undefined;choice.hidden=true;}
  });
});
document.querySelectorAll('[data-assessment]').forEach(form=>{
  const config=JSON.parse(form.dataset.assessment),brief=form.querySelector('[data-assessment-brief]');
  let selected;
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const output=form.querySelector('[data-assessment-result]'),list=output.querySelector('ul');
    list.replaceChildren();
    const fieldsets=[...form.querySelectorAll('fieldset')];
    const answers=fieldsets.map(fieldset=>fieldset.querySelector(':checked').value);
    const recommendation=config.recommendations[config.options.indexOf(answers[0])];
    selected=recommendation.context;
    const route=form.querySelector('[data-recommended-route]');route.href=recommendation.route;route.textContent=recommendation.title;
    const lines=[recommendation.title,...fieldsets.map((fieldset,i)=>fieldset.querySelector('legend').textContent+' '+answers[i])];
    const points=answers.slice(1).map((answer,i)=>config.rules[i][config.answers[i].indexOf(answer)]);
    // Three topics: service/current access, initiation, and recovery. Every answer contributes.
    const questions=[points.slice(0,2).join(' '),points[2],points[3]];
    questions.forEach(question=>{const item=document.createElement('li');item.textContent=question;list.append(item);lines.push(question);});brief.value=lines.join('\n');
    output.hidden=false;output.tabIndex=-1;output.focus();
  });
  form.addEventListener('change',()=>{
    form.querySelector('[data-assessment-result]').hidden=true;
    contactControllers.get(document.querySelector('[data-contact]'))?.cancelPending();
  });
  form.querySelector('[data-assessment-use]').addEventListener('click',()=>{
    const inline=document.querySelector('[data-inline-request]');if(inline)inline.hidden=false;
    const contact=document.querySelector('[data-contact]');
    contactControllers.get(contact).apply(brief.value,selected);
  });
  form.querySelector('[data-assessment-copy]').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(brief.value);form.querySelector('[data-assessment-status]').textContent=config.copied;}
    catch{brief.focus();brief.select();}
  });
});
document.querySelectorAll('[data-expectation]').forEach(example=>{
  const copy=JSON.parse(example.dataset.expectation);
  const status=example.querySelector('[data-expectation-result]'),decline=example.querySelector('[data-expectation-decline]'),reset=example.querySelector('[data-expectation-reset]');
  let state='waiting';
  function render(){
    const declined=state==='declined';example.dataset.state=state;
    example.querySelector('[data-expectation-service]').textContent=declined?copy.declinedService:copy.waiting;
    example.querySelector('[data-expectation-copy]').textContent=declined?copy.declinedApp:copy[example.querySelector(':checked').value];
    status.textContent=declined?copy.declinedStatus:'';
    decline.hidden=declined;reset.hidden=!declined;
  }
  example.addEventListener('change',()=>{state='waiting';render();});
  decline.addEventListener('click',()=>{state='declined';render();reset.focus({preventScroll:true});});
  reset.addEventListener('click',()=>{state='waiting';render();decline.focus({preventScroll:true});});
  render();
});
