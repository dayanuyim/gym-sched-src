import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/css-tooltip/dist/css-tooltip.css';
import './css/app.css';

import $ from 'jquery';
import 'popper.js';
import 'bootstrap';

import * as templates from './templates';
import {Period, strToMinutes} from './utils.js';
import {htmlToElement} from './dom-utils';

import Cookies from 'js-cookie';

let MAX_Z = 0;
const Basetime = strToMinutes("08:30");

function indexOfChild(child: HTMLElement){
    return Array.from(child.parentNode.children).indexOf(child);
}

// define 2vw per 10min. (use "vw" here, not "vh"!)
function timeLen(value: number){
    return (value / 10 * 2) + "vw"
}

function toInnerDay(day){
    return day - 1;   // day 1 (Mon.) as the first day (0)
    //return day % 7;   // day 7 (Sun.) as the first day (0)
}

// load courses, populate meta data, sort to uniq seq
const Courses = function()
{
    const raw = require("../courses.json")

    //init
    const res = Array(7).fill(0).map(e => []);

    // classified by day of week, flaten by add location, group time&len to Period
    for (const [loc, courses] of Object.entries(raw)) {
        (<Array<any>>courses).forEach(course => {
            const begin = strToMinutes(course.time);
            const end = begin + course.len;
            const day = toInnerDay(course.day);
            delete course.time;
            delete course.len;
            delete course.day;
            if(0 <= day && day < 7){
                Object.assign(course, {
                    loc,
                    period: new Period(begin, end),
                });
                res[day].push(course);
            }
        });
    }

    // sort by begin time / end time, but also more to define a uniqe sequence
    res.forEach(courses => courses.sort((c1, c2) => {
            let cmp = c1.period.begin - c2.period.begin;      //must
            if(cmp == 0) cmp = c1.period.end - c2.period.end; //must, for adjecent detection (type_sn) 
            if(cmp == 0) cmp = c1.type.localeCompare(c2.type);
            if(cmp == 0) cmp = c1.loc.localeCompare(c2.loc);
            if(cmp == 0) cmp = c1.teacher.localeCompare(c2.teacher);
            if(cmp == 0) cmp = c1.name.localeCompare(c2.name);
            return cmp;
        }));

    // tag position is 25% per step, usually a course is 60min. so 15min per step.
    const get_look = (curr, last) =>{
        const diff = Math.floor((curr.period.begin - last.period.begin) / 15);
        return Math.max(1, last.look + 1 - diff);
    };

    // search back if any adjacent course with the same type
    const get_type_sn = (curr, arr, from) => {
        for(let i = from; i >= 0; --i){
            const last = arr[i];
            if(!curr.period.is_adjacent(last.period))
                return 1;
            if(curr.type == last.type)
                return last.type_sn + 1;
            //otherwise, keep searching
        }
        return 1;
    }

    // put meta data
    res.forEach(courses => {
        courses.forEach((curr, idx, arr) => {
            Object.assign(curr, {
                pickable: true,
                sn: idx + 1,
                look: (idx == 0)? 1: get_look(curr, arr[idx-1]),  //i - findIdxLast(courses, i, (c1, c2) => !c1.period.is_overlay(c2.period));
                type_sn: get_type_sn(curr, arr, idx-1),
            });
        });
    })
    return res;
}();

function courseObjToElem(c){
    return htmlToElement(templates.course(c));
}

function courseElemToObj(el, mod?){
    const obj = {
        sn:       parseInt(el.querySelector(".course-sn").innerHTML),
        pickable: el.querySelector("button.pick") != null,
        look:     el.querySelector(".course-look").innerHTML,
        type_sn:  el.querySelector(".course-type-sn").innerHTML,
        type:     el.querySelector(".course-type").innerHTML,
        loc:      el.querySelector(".course-loc").innerHTML,
        period:   el.querySelector(".course-period").innerHTML,
        name:     el.querySelector(".course-name").innerHTML,
        teacher:  el.querySelector(".course-teacher").innerHTML,
    };
    if(mod)
        Object.assign(obj, mod);
    return mod;
}

function showCourses(){
    //restore picked courses from cookie
    loadPickedCourses();

    document.querySelectorAll('.day').forEach((day_el, day) =>{
        const courses_el = day_el.querySelector('.courses');
        Courses[day].forEach(c => {
            courses_el.insertAdjacentElement('beforeend', createCourse(c));
        });
    })
}

//TODO: handle whetehr has pick buttons or not
function createCourse(course): HTMLElement {
    const el = courseObjToElem(course);
    setCoursePosition(el, course.period);

    setCourseBasicEvents(el);

    if (course.pickable) {
        el.querySelectorAll('button.pick').forEach(btn => {
            btn.addEventListener("click", coursePickHandler);
        });
    }

    return el;
}

function setCoursePosition(el: HTMLElement, period: Period){
    el.style.top = timeLen(period.begin - Basetime);
    el.style.height = timeLen(period.duration);
}

// for normal or picked course HTMLelements
function setCourseBasicEvents(course: HTMLElement): void {
    course.querySelector<HTMLElement>(".course-del").onclick = courseDeleteHandler;
    course.onclick = courseTopHandler;
}

function courseDeleteHandler(e){
    const course = <HTMLElement>e.target.closest(".course");
    course.style.display = 'none';

    if(course.querySelector('button.pick') == null){ // is picked course
        savePickedCourses();
    }
}

const courseTopHandler = e => {
    const target = <HTMLElement>e.target;
    const course = <HTMLElement>target.closest(".course")
    course.style.zIndex = (++MAX_Z).toString();
};

function coursePickHandler(e)
{
    const pos = parseInt(e.target.innerHTML) - 1;
    const course = <HTMLElement>e.target.closest(".course");
    const day = <HTMLElement>course.closest(".day");
    const day_n = indexOfChild(day);
    const sn = parseInt(course.querySelector(".course-sn").innerHTML);

    /*
    //check if any duplication
    const pickeds = Array.from(day.querySelectorAll<HTMLElement>(".picked .course"));
    const course_id = course.querySelector(".course-id").innerHTML;
    if(pickeds.find(c => c.querySelector(".course-id").innerHTML == course_id))
        return;
    const picked = pickeds[pos];
    */

    setPickCourse(day_n, pos, sn);

    //rec picked courses to coockie
    savePickedCourses();
 }

 function setPickCourse(day, pos, sn)
 {
    if(day < 0 || day >= 7) return;

    const picked_el = document.body.querySelector(`.day${day} .picked`);
    const pick_el = (pos) => picked_el.querySelectorAll<HTMLElement>('.course')[pos];
    const courses = Courses[day];

    if(sn <= 0 || sn > courses.length)
        pick_el(pos).style.display = 'none';
    else{
        const c = Object.assign({}, courses[sn-1], {
            pickable: false,
            look : 1,
        });
        pick_el(pos).outerHTML = templates.course(c);
        setCourseBasicEvents(pick_el(pos));
    }
 }

 function savePickedCourses()
 {
    const pickset = Array.from(document.body.querySelectorAll('.day')).map(day => {
        return Array.from(day.querySelectorAll<HTMLElement>('.picked .course .course-sn')).map(sn => {
            return (sn.offsetParent === null)? // is hidden?
                    0: parseInt(sn.innerHTML);
        })
    });

    /*
    const value = JSON.stringify(pickset);
    if (value.length >= 4096)
        console.warn(`The cookie size is larger 4096: ${value.length}`)
    document.cookie = value;
    */
    Cookies.set('pickset', JSON.stringify(pickset));
 }

 function loadPickedCourses(){
    const pickset = getCookiePickset();
    pickset.forEach((picks, day) => {
        picks.forEach((sn, pos) => {
            setPickCourse(day, pos, sn);
        });
    });
 }

function getCookiePickset()
{
    const pickset = Cookies.get('pickset') || document.cookie; //TODO: the 2nd statement is for backward compatibility, remove it later.
    if (pickset){
        try{
            return JSON.parse(pickset);
        }
        catch (err) {
            console.error(`Parse Cookie Error: ${err}`);
        }
    }

    return Array(7).fill([0, 0]);
}

const showView = async () => {
    const [view, ...params] = window.location.hash.split('/');
    switch(view){
        case '#main':
            showCourses();
            break;
        default:
            throw Error(`Unrecognized view: ${view}`);
    }
};

// Page setup.
(async () => {
    document.body.innerHTML = templates.main({header: "12月"});
    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#main');
})();
