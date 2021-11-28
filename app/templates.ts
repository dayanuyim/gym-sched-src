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


export const main = Handlebars.compile(`
    <h4 class="header">{{header}}</h4>
    <section class="container">
        <div class="day day1">
            <div class="picked"></div>
            <div class="title">Mon</div>
            <div class="courses"></div>
        </div>
        <div class="day day2">
            <div class="picked"></div>
            <div class="title">Thu</div>
            <div class="courses"></div>
        </div>
        <div class="day day3">
            <div class="picked"></div>
            <div class="title">Wed</div>
            <div class="courses"></div>
        </div>
        <div class="day day4">
            <div class="picked"></div>
            <div class="title">Thr</div>
            <div class="courses"></div>
        </div>
        <div class="day day5">
            <div class="picked"></div>
            <div class="title">Fri</div>
            <div class="courses"></div>
        </div>
        <div class="day day6">
            <div class="picked"></div>
            <div class="title">Sat</div>
            <div class="courses"></div>
        </div>
        <div class="day day7">
            <div class="picked"></div>
            <div class="title">Sun</div>
            <div class="courses"></div>
        </div>
    </section>
`);

export const course = Handlebars.compile(`
    <div class="course course{{overlay_sn}} course-{{type}}{{type_sn}}">

           <span class="course-overlay-sn" style="display:none">{{overlay_sn}}</span>
           <span class="course-type" style="display:none">{{type}}</span>
           <span class="course-type-sn" style="display:none">{{type_sn}}</span>

           <span class="course-sn course-sn{{overlay_sn}}">{{sn}}</span>
        🏠 <span class="course-loc">{{loc}}</span><br>
        ⏳ <span class="course-period">{{period}}</span><br>
           <span class="course-name">{{name}}</span><br>
        👱 <span class="course-teacher">{{teacher}}</span><br>
        {{#if pick}}
        <button class="pick">PICK</button>
        {{/if}}
    </div>
`);
