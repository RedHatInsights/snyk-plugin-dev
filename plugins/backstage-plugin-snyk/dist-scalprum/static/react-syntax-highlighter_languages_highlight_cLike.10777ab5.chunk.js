(self.webpackChunkbackstage_plugin_snyk=self.webpackChunkbackstage_plugin_snyk||[]).push([[2108],{88636:e=>{function t(e){return n("(",e,")?")}function n(...e){return e.map((e=>{return(t=e)?"string"==typeof t?t:t.source:null;var t})).join("")}e.exports=function(e){const a=function(e){const a=e.COMMENT("//","$",{contains:[{begin:/\\\n/}]}),s="decltype\\(auto\\)",i="[a-zA-Z_]\\w*::",r="("+s+"|"+t(i)+"[a-zA-Z_]\\w*"+t("<[^<>]+>")+")",c={className:"keyword",begin:"\\b[a-z\\d_]*_t\\b"},o={className:"string",variants:[{begin:'(u8?|U|L)?"',end:'"',illegal:"\\n",contains:[e.BACKSLASH_ESCAPE]},{begin:"(u8?|U|L)?'(\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)|.)",end:"'",illegal:"."},e.END_SAME_AS_BEGIN({begin:/(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,end:/\)([^()\\ ]{0,16})"/})]},l={className:"number",variants:[{begin:"\\b(0b[01']+)"},{begin:"(-?)\\b([\\d']+(\\.[\\d']*)?|\\.[\\d']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)"},{begin:"(-?)(\\b0[xX][a-fA-F0-9']+|(\\b[\\d']+(\\.[\\d']*)?|\\.[\\d']+)([eE][-+]?[\\d']+)?)"}],relevance:0},u={className:"meta",begin:/#\s*[a-z]+\b/,end:/$/,keywords:{"meta-keyword":"if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include"},contains:[{begin:/\\\n/,relevance:0},e.inherit(o,{className:"meta-string"}),{className:"meta-string",begin:/<.*?>/},a,e.C_BLOCK_COMMENT_MODE]},d={className:"title",begin:t(i)+e.IDENT_RE,relevance:0},p=t(i)+e.IDENT_RE+"\\s*\\(",m={keyword:"int float while private char char8_t char16_t char32_t catch import module export virtual operator sizeof dynamic_cast|10 typedef const_cast|10 const for static_cast|10 union namespace unsigned long volatile static protected bool template mutable if public friend do goto auto void enum else break extern using asm case typeid wchar_t short reinterpret_cast|10 default double register explicit signed typename try this switch continue inline delete alignas alignof constexpr consteval constinit decltype concept co_await co_return co_yield requires noexcept static_assert thread_local restrict final override atomic_bool atomic_char atomic_schar atomic_uchar atomic_short atomic_ushort atomic_int atomic_uint atomic_long atomic_ulong atomic_llong atomic_ullong new throw return and and_eq bitand bitor compl not not_eq or or_eq xor xor_eq",built_in:"_Bool _Complex _Imaginary",_relevance_hints:["asin","atan2","atan","calloc","ceil","cosh","cos","exit","exp","fabs","floor","fmod","fprintf","fputs","free","frexp","auto_ptr","deque","list","queue","stack","vector","map","set","pair","bitset","multiset","multimap","unordered_set","fscanf","future","isalnum","isalpha","iscntrl","isdigit","isgraph","islower","isprint","ispunct","isspace","isupper","isxdigit","tolower","toupper","labs","ldexp","log10","log","malloc","realloc","memchr","memcmp","memcpy","memset","modf","pow","printf","putchar","puts","scanf","sinh","sin","snprintf","sprintf","sqrt","sscanf","strcat","strchr","strcmp","strcpy","strcspn","strlen","strncat","strncmp","strncpy","strpbrk","strrchr","strspn","strstr","tanh","tan","unordered_map","unordered_multiset","unordered_multimap","priority_queue","make_pair","array","shared_ptr","abort","terminate","abs","acos","vfprintf","vprintf","vsprintf","endl","initializer_list","unique_ptr","complex","imaginary","std","string","wstring","cin","cout","cerr","clog","stdin","stdout","stderr","stringstream","istringstream","ostringstream"],literal:"true false nullptr NULL"},_={className:"function.dispatch",relevance:0,keywords:m,begin:n(/\b/,/(?!decltype)/,/(?!if)/,/(?!for)/,/(?!while)/,e.IDENT_RE,(g=/\s*\(/,n("(?=",g,")")))};var g;const b=[_,u,c,a,e.C_BLOCK_COMMENT_MODE,l,o],f={variants:[{begin:/=/,end:/;/},{begin:/\(/,end:/\)/},{beginKeywords:"new throw return else",end:/;/}],keywords:m,contains:b.concat([{begin:/\(/,end:/\)/,keywords:m,contains:b.concat(["self"]),relevance:0}]),relevance:0},h={className:"function",begin:"("+r+"[\\*&\\s]+)+"+p,returnBegin:!0,end:/[{;=]/,excludeEnd:!0,keywords:m,illegal:/[^\w\s\*&:<>.]/,contains:[{begin:s,keywords:m,relevance:0},{begin:p,returnBegin:!0,contains:[d],relevance:0},{begin:/::/,relevance:0},{begin:/:/,endsWithParent:!0,contains:[o,l]},{className:"params",begin:/\(/,end:/\)/,keywords:m,relevance:0,contains:[a,e.C_BLOCK_COMMENT_MODE,o,l,c,{begin:/\(/,end:/\)/,keywords:m,relevance:0,contains:["self",a,e.C_BLOCK_COMMENT_MODE,o,l,c]}]},c,a,e.C_BLOCK_COMMENT_MODE,u]};return{name:"C++",aliases:["cc","c++","h++","hpp","hh","hxx","cxx"],keywords:m,illegal:"</",classNameAliases:{"function.dispatch":"built_in"},contains:[].concat(f,h,_,b,[u,{begin:"\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<",end:">",keywords:m,contains:["self",c]},{begin:e.IDENT_RE+"::",keywords:m},{className:"class",beginKeywords:"enum class struct union",end:/[{;:<>=]/,contains:[{beginKeywords:"final class struct"},e.TITLE_MODE]}]),exports:{preprocessor:u,strings:o,keywords:m}}}(e);return a.disableAutodetect=!0,a.aliases=[],e.getLanguage("c")||a.aliases.push("c","h"),e.getLanguage("cpp")||a.aliases.push("cc","c++","h++","hpp","hh","hxx","cxx"),a}}}]);
//# sourceMappingURL=react-syntax-highlighter_languages_highlight_cLike.10777ab5.chunk.js.map