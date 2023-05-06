let locks = []



exports.isLocked = (roomName) => {
    if(locks.includes(roomName)) {
        return true
    } else {
        return false
    }
}



exports.lockRoomName = (roomName) => {
    if(locks.includes(roomName)) {
        console.log(`Room name ${roomName} is already locked.`)
    } else {
        locks.push(roomName)
    }
}



exports.unlockRoomName = (roomName) => {
    if(!locks.includes(roomName)) {
        console.log(`Room name ${roomName} isn't locked.`)
    } else {
        const newLocks = locks.filter(lock => lock !== roomName)

        locks = newLocks
    }
}