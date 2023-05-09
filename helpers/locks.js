let locks = {
    rooms: [],
    users: []
}




exports.isLocked = (value, type) => {
    if(locks[type].includes(value)) {
        return true
    } else {
        return false
    }
}



exports.lock = (value, type) => {
    if(locks[type].includes(value)) {
        console.log(`Value "${value}" for type "${type}" is already locked.`)
    } else {
        locks[type].push(value)
    }
}



exports.unlock = (value, type) => {
    if(!locks[type].includes(value)) {
        console.log(`Value "${value}" for type "${type}" is not locked.`)
    } else {
        const newLocks = locks[type].filter(lock => lock !== value)

        locks[type] = newLocks
    }
}