import * as Handlebars from '../node_modules/handlebars/dist/handlebars.js';

Handlebars.registerHelper("inc", (value, options) => parseInt(value)+1);
Handlebars.registerHelper("indexOf", (arr, elem, options) => arr.indexOf(elem));
Handlebars.registerHelper("ifeql", function(v1, v2, options){
    return (v1 === v2)? options.fn(this): options.inverse(this);
});

Handlebars.registerHelper("offset", (span, begin, options) => 100 * (begin-span.begin) / span.duration);
Handlebars.registerHelper("ratio", (span, duration, options) => 100 * duration / span.duration);

Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
});

Handlebars.registerHelper('for', function(from, to, incr, block) {
    var accum = '';
    for(var i = from; i < to; i += incr)
        accum += block.fn(i);
    return accum;
});

////////////////////////////////////////////////////////////////////////

export const course = Handlebars.compile(`
    <div class="course course{{look}} course-{{type}}{{type_sn}}">
        <div class="course-del">&times;</div>

           <span style="display:none" class="course-look">{{look}}</span>
           <span style="display:none" class="course-type">{{type}}</span>
           <span style="display:none" class="course-type-sn">{{type_sn}}</span>

           <span class="course-sn course-sn{{look}}">{{sn}}</span>
           <span class="course-name">{{name}}</span><br>
        ⏳ <span class="course-period">{{period}}</span><br>
        👱 <span class="course-teacher">{{teacher}}</span><br>
        🏠 <span class="course-loc">{{loc}}</span><br>
        {{#if pickable}}
        <button class="pick">1</button>
        <button class="pick">2</button>
        {{/if}}
    </div>
`);

Handlebars.registerHelper("null_course", (options) => {
    return new Handlebars.SafeString(course({
        sn: 0,
    }));
});

Handlebars.registerHelper("day_name", (idx, options) => {
    const names = [ "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" ];
    return new Handlebars.SafeString(names[idx]);
});

const day = Handlebars.compile(`
    <div class="day day{{idx}}">
        <div class="picked">
            {{null_course}}
            {{null_course}}
        </div>
        <div class="title">{{day_name idx}}</div>
        <div class="courses">
            <div class="timeline timeline-noon"></div>
            <div class="timeline timeline-night"></div>
        </div>
    </div>
`);

Handlebars.registerHelper("day", (idx, options) => {
    return new Handlebars.SafeString(day({idx}));
});

export const main = Handlebars.compile(`
    <h4 class="header">{{header}}</h4>
    <section class="container">
        {{#for 0 7 1}}
            {{day this}}
        {{/for}}
    </section>
`);
