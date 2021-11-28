export const strToMinutes = function(str)
{
    const tokens = (str.indexOf(':') >= 0)?
        str.split(':'):
        str.split('：');
    
    const [h, m] = tokens;

    return  Number(h) * 60 + Number(m);
}

function padZero(num, len = 2){
    num = String(num);
    for(let i = num.length; i < len; ++i)
        num = '0' + num;
    return num;
}

function minutesToStr(min)
{
    let h = Math.floor(min/60);
    let m = min - h * 60;
    return padZero(h) + ":" + padZero(m);
}

export function dropFile(el, callback)
{
    const unpropagate = (e) => {
        e.stopPropagation();
        e.preventDefault();
    }
    el.addEventListener('dragenter', unpropagate, false);

    el.addEventListener('dragover', e => {
        unpropagate(e);
        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }, false);

    el.addEventListener('drop', e => {
        unpropagate(e);
        Array.from(e.dataTransfer.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(callback)
                    setImmediate(()=>callback(e.target.result));  // yield cpu
            }
            reader.readAsText(file, "UTF-8");
        })
    }, false);
}

// Period ===================================
export const Period = function(begin, end){
    this.begin = begin;
    this.end = end;

    //properties
    this.duration = this.end - this.begin;
}
Period.prototype.toString = function(){
    return minutesToStr(this.begin) + "~" + minutesToStr(this.end);
}
Period.prototype.contains = function(rhs){
    return this.begin <= rhs.begin && this.end >= rhs.end;
}
Period.prototype.is_overlay = function(rhs){
    return !(this.begin >= rhs.end || this.end <= rhs.begin);
}
// Slot ===========================
export const Slot = function(label, period){
    this.label = label;
    this.period = period;

    //export period properties
    this.begin = this.period.begin;
    this.end = this.period.end;
    this.duration = this.period.duration;
}

Slot.prototype.toString = function(){
    return this.label + "[" + this.period.toString() + "]";
}

// Sched ============================
export const Sched = function(slot=null){
    this.slots = slot? [slot]: [];

    Object.defineProperty(this, "begin", {
        get: function(){
            if(this.slots.length > 0)
                return this.slots[0].begin;
            return null;
        },
        enumerable: true
    });

    Object.defineProperty(this, "end", {
        get: function(){
            if(this.slots.length > 0)
                return this.slots[this.slots.length - 1].end;
            return null;
        },
        enumerable: true
    });

    Object.defineProperty(this, "duration", {
        get: function(){
            if(this.begin != null && this.end != null)
                return this.end - this.begin;
            return 0;
        },
        enumerable: true
    });
}

Sched.prototype.put = function(slot)
{
    this.slots.unshift(slot);
}

Sched.prototype.toString = function(){
    var txts = this.slots.map(s => s.toString());
    return "(" + txts.join() + ")"
}

// Algo ============================

const putSlotToScheds = function(scheds, slot)
{
    scheds.forEach(s => s.put(slot));
}

const excludeSlots = function(slots, label)
{
    return slots.filter(slot => slot.label !== label)
}

export const pickSlots = function(period, slots){
    if(!slots.length)
        return [ new Sched() ];  //empty schedule

    // not pick the first
    const sub_slots = slots.slice(1);
    let scheds = pickSlots(period, sub_slots);

    // Or pick the first slot
    const target = slots[0];
    if(period.contains(target.period)){
        //pick the rest
        const sub_slots = excludeSlots(slots, target.label);
        const sub_period = new Period(target.period.end, period.end);
        const sub_scheds = pickSlots(sub_period, sub_slots);
        putSlotToScheds(sub_scheds, target);
        scheds = scheds.concat(sub_scheds);
    }

    return scheds;
}

//like Array.findIndex, but search from the last, and has 'from'
export function findLastIndex(arr, eq, from){
    if(from == null) from = arr.length - 1;

    for(var i = from; i >= 0; --i)
        if(eq(arr[i]))
            break;
    return Math.max(-1, i);
}
