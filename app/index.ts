import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/css-tooltip/dist/css-tooltip.css';
import './css/app.css';

import $ from 'jquery';
import 'popper.js';
import 'bootstrap';

import * as templates from './templates';
import {Period, strToMinutes, findLastIndex} from './utils.js';
import {htmlToElement} from './dom-utils';

let MAX_Z = 0;
const Basetime = strToMinutes("08:30");

// define 2vw per 10min. (use "vw" here, not "vh"!)
function timeLen(value: number){
    return (value / 10 * 2) + "vw"
}

function getCourses(){

    const data = require("../courses.json")

    // flaten by add location, also time[] to Period.
    const res = [];
    for (const [loc, courses] of Object.entries(data)) {
        (<Array<any>>courses).forEach(course => {
            const begin = strToMinutes(course.time[0]);
            const end = strToMinutes(course.time[1])
            if(begin >= end){
                console.error(`Invalid Time: Day(${course.day}), Name(${course.name})`);
                return;
            }
            res.push(Object.assign(course, {
                loc,
                period: new Period(begin, end),
            }));
        });
    }
    return res;
}

function listCourses(){
    // hide pick courses
    document.body.querySelectorAll('.picked .course').forEach(el => {
        (<HTMLElement>el).style.display = 'none';
    })

    const courses = getCourses();
    for(let day = 1; day <= 7; ++day){
        listDayCourses(day, courses.filter(c => c.day == day));
    }
}

function listDayCourses(day: number, courses)
{
    courses.sort((c1, c2) => c1.period.begin - c2.period.begin);

    // tag position is 25% per step, usually a course is 60min. so 15min per step.
    const get_overlay_sn = (curr, last) =>{
        const diff = Math.floor((curr.period.begin - last.period.begin) / 15);
        return Math.max(1, last.overlay_sn + 1 - diff);
    }

    const courses_el = document.querySelector(`.day${day} .courses`);

    //fill up the courses
    for(let i = 0; i < courses.length; ++i) {
        const course = courses[i];
        Object.assign(course, {
            pickable: true,
            id: Math.floor(Math.random() * 1000000),
            sn: i + 1,
            overlay_sn: (i == 0)? 1: get_overlay_sn(course, courses[i-1]),  //i - findIdxLast(courses, i, (c1, c2) => !c1.period.is_overlay(c2.period));
            type_sn: i - findLastIndex(courses, c => c.type != course.type, i -1),
        });
        courses_el.insertAdjacentElement('beforeend', createCourse(course));
    }
}

//TODO: handle whetehr has pick buttons or not
function createCourse(course): HTMLElement {
    const el = htmlToElement(templates.course(course));
    setCoursePosition(el, course.period);
    el.addEventListener("click", courseTopHandler);

    if (course.pickable) {
        el.querySelectorAll('button.pick').forEach(btn => {
            btn.addEventListener("click", coursePickHandlers[btn.innerHTML]);
        });
    }

    return el;
}

function setCoursePosition(el: HTMLElement, period: Period){
    el.style.top = timeLen(period.begin - Basetime);
    el.style.height = timeLen(period.duration);
}

const courseTopHandler = e => {
    const target = <HTMLElement>e.target;
    const course = <HTMLElement>target.closest(".course")
    course.style.zIndex = (++MAX_Z).toString();
};

const coursePickHandlers = [
    null,
    mkCoursePickHandler(1),
    mkCoursePickHandler(2),
];

function mkCoursePickHandler(pos){
    return e => {
        const course = <HTMLElement>e.target.closest(".course");
        const day = <HTMLElement>course.closest(".day");

        const pickeds = Array.from<HTMLElement>(day.querySelectorAll(".picked .course"));

        /*
        //check if any duplication
        const course_id = course.querySelector(".course-id").innerHTML;
        if(pickeds.find(c => c.querySelector(".course-id").innerHTML == course_id))
            return;
        */

        const picked = pickeds[pos-1];
        picked.outerHTML = templates.course({
                pickable:   false,
                id:         course.querySelector(".course-id").innerHTML,
                sn:         course.querySelector(".course-sn").innerHTML,
                overlay_sn: course.querySelector(".course-overlay-sn").innerHTML,
                type_sn:    course.querySelector(".course-type-sn").innerHTML,
                type:       course.querySelector(".course-type").innerHTML,
                loc:        course.querySelector(".course-loc").innerHTML,
                period:     course.querySelector(".course-period").innerHTML,
                name:       course.querySelector(".course-name").innerHTML,
                teacher:    course.querySelector(".course-teacher").innerHTML,
            });

        day.querySelectorAll<HTMLElement>(".picked .course")[pos-1].onclick = courseTopHandler;
        //picked.addEventListener("click", courseTopHandler);
        //picked.style.display = "block"
    };
}


const showView = async () => {
    const [view, ...params] = window.location.hash.split('/');
    switch(view){
        case '#main':
            listCourses();
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
