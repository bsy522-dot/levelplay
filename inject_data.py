import json, os

with open('index.html','r',encoding='utf-8') as f:
    html = f.read()

def safe(s, mx=55):
    s = str(s)[:mx]
    for c in ["'",'"','\\','\n','\r','\u2018','\u2019','\u201C','\u201D','\u2032','\u2033','\u00B4']:
        s = s.replace(c,'')
    return s

def mkitem(i):
    t=safe(i.get('title',''),50); s=safe(i.get('source',''),18); d=safe(i.get('description',''),55)
    u=safe(i.get('url',''),200); v=i.get('videoId','')
    if v and v.strip() and 'youtube' not in u: u=f'https://www.youtube.com/watch?v={v}'
    try: l=max(1,min(5,int(i.get('level',2))))
    except: l=2
    return "{l:%d,t:'%s',s:'%s',u:'%s',d:'%s'}" % (l,t,s,u,d)

def insert(html, tgt, key, items, bound):
    st=html.find('const %s={' % tgt); eb=html.find(bound,st)
    p=html.find('%s:[' % key, st)
    if p>0 and p<eb:
        e=html.find('],',p+len('%s:[' % key))
        if e>0 and e<p+30000:
            ins=',\n'+',\n'.join(items)
            return html[:e]+ins+html[e:],len(items)
    return html,0

total=0

# 1. kids_other_subjects
try:
    with open('data/kids_other_subjects.json','r',encoding='utf-8') as f: d=json.load(f)
    for kr,en in [('음악','music'),('스포츠','sports'),('관찰탐구','explore'),('사회감성','social'),('건강','health'),('언어두뇌발달','language'),('특별활동','special')]:
        items=[mkitem(i) for i in d if i.get('subject')==kr]
        html,n=insert(html,'KIDS',en,items,'const ADULT='); total+=n
        if n: print('K.%s+%d' % (en,n))
except Exception as e: print('E1:'+str(e))

# 2. adult_other_subjects
try:
    with open('data/adult_other_subjects.json','r',encoding='utf-8') as f: d=json.load(f)
    if isinstance(d,list):
        am={'music':'music','sports':'sports','nature_explore':'explore','language_brain':'language','health':'health','social_emotional':'social','special_activity':'special'}
        for rs in set(i.get('subject','') for i in d):
            en=am.get(rs,rs)
            items=[mkitem(i) for i in d if i.get('subject')==rs]
            html,n=insert(html,'ADULT',en,items,'// ===== COMMUNITY'); total+=n
            if n: print('A.%s+%d' % (en,n))
except Exception as e: print('E2:'+str(e))

# 3. kids_history_math_science
try:
    with open('data/kids_history_math_science.json','r',encoding='utf-8') as f: r=json.load(f)
    d=r.get('contents',[])
    for s in ['history','math','science']:
        items=[mkitem(i) for i in d if i.get('subject')==s][:15]
        html,n=insert(html,'KIDS',s,items,'const ADULT='); total+=n
        if n: print('K.%s+%d' % (s,n))
except Exception as e: print('E3:'+str(e))

# 4. community
try:
    with open('data/community_posts.json','r',encoding='utf-8') as f: ps=json.load(f)
    if isinstance(ps,dict): ps=ps.get('posts',ps.get('data',[]))
    cm={'AI공유':'ai','AI':'ai','개발코딩':'dev','개발':'dev','프로그램':'prog','교육강좌':'edu','교육':'edu','게임':'game','과학기술':'sci','과학':'sci','자유':'free','질문답변':'qna','질문':'qna'}
    jps=[]
    for i,p in enumerate(ps):
        g=cm.get(p.get('category',p.get('g','free')),'free')
        t=safe(p.get('title',p.get('t','')),50); b=safe(p.get('body',p.get('b','')),180)
        a=safe(p.get('author',p.get('a','익명')),10); lk=p.get('likes',p.get('l',50+i*7)); m=30+i*45
        cs=[]
        for c in (p.get('comments',p.get('c',[])))[:3]:
            ca=safe(c.get('author',c.get('a','댓글러')),10); ct=safe(c.get('text',c.get('t','')),70)
            cx=c.get('time_minutes',c.get('m',m-10))
            cs.append("{a:'%s',t:'%s',m:%d}" % (ca,ct,cx))
        jps.append("{id:%d,g:'%s',t:'%s',b:'%s',a:'%s',l:%d,c:[%s],m:%d}" % (100+i,g,t,b,a,lk,','.join(cs),m))
    pos=html.find('const P=['); end=html.find('];',pos)
    if pos>=0 and end>0:
        html=html[:end]+',\n'+',\n'.join(jps)+html[end:]
        total+=len(jps); print('Community+%d' % len(jps))
except Exception as e: print('E4:'+str(e))

# 5. detail files
for fn,tgt,key in [('adult_history_extra.json','ADULT','history'),('kids_history_detail.json','KIDS','history'),('adult_economy_detail.json','ADULT','economy'),('adult_sports_detail.json','ADULT','sports')]:
    try:
        fp='data/'+fn
        if not os.path.exists(fp): continue
        with open(fp,'r',encoding='utf-8') as f: r=json.load(f)
        if isinstance(r,dict): r=r.get('contents',r.get('data',[]))
        items=[mkitem(i) for i in r if isinstance(i,dict)]
        bd='const ADULT=' if tgt=='KIDS' else '// ===== COMMUNITY'
        html,n=insert(html,tgt,key,items,bd); total+=n
        if n: print('%s.%s+%d' % (tgt,key,n))
    except Exception as e: print('E5 %s:%s' % (fn,e))

# 6. extra_contents
try:
    with open('data/extra_contents.json','r',encoding='utf-8') as f: r=json.load(f)
    kids_extra={}; adult_extra={}
    for item in r:
        sub=item.get('subject',''); age=item.get('age','adult')
        k=None
        if any(x in sub for x in ['경제','금융']): k='economy'
        elif any(x in sub for x in ['직업','진로']): k='career'
        elif any(x in sub for x in ['물리','역학','화학','생물','지구','천문']): k='science'
        elif any(x in sub for x in ['피아노','바이올린','기타','드럼']): k='music'
        elif any(x in sub for x in ['골프','복싱','수영','요가']): k='sports'
        else: k='special'
        d=kids_extra if age=='kids' else adult_extra
        if k not in d: d[k]=[]
        d[k].append(mkitem(item))
    for k,items in kids_extra.items():
        html,n=insert(html,'KIDS',k,items,'const ADULT='); total+=n
        if n: print('Kx.%s+%d' % (k,n))
    for k,items in adult_extra.items():
        html,n=insert(html,'ADULT',k,items,'// ===== COMMUNITY'); total+=n
        if n: print('Ax.%s+%d' % (k,n))
except Exception as e: print('E6:'+str(e))

with open('index.html','w',encoding='utf-8') as f: f.write(html)
print('\nTotal: %d' % total)
