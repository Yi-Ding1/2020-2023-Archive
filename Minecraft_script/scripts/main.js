import { Location, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

//global variables
const START_TICK = 150;
const START_TICK2 = 250;
var curTick = 0;

var PlayerInfo = {};
var TempCheckPoint = {};
var CheckPointList = [];
var CoordDisplay = {};
const overworld = world.getDimension('overworld');
const theEnd = world.getDimension('the_end');
const StaticVelocity = 0;
const dbquery = {location:new Location(0,0,0),type:"mcpk:database"};

//only for pc players because holding down on your mouse keeps firing item use event (version 1.0 patch)
const logBook = {};
//new way to check block checkpoint record
const logBook2 = {}

//comparison between two arrays
function contains(a,b) {
  if(JSON.stringify(a) == JSON.stringify(b)) {
    return true
  } else {
    return false
  }
}

//extracting info from database after certain ticks
function gameTick() {
  curTick++
  if (curTick === START_TICK) {
    try { 
      theEnd.runCommandAsync(`tickingarea add 0 0 0 0 0 0 McpkDatabase`)
    } catch(err) {}
  }
  if (curTick === START_TICK2) {
    let CheckPointSignData = Array.from(theEnd.getEntities(dbquery));

    //if database is not found
    if (CheckPointSignData.length < 1) {
      try {
        theEnd.spawnEntity("mcpk:database", new Location(0, 0, 0));
        overworld.runCommandAsync(`tellraw @a {"rawtext":[{"translate":"mcpk.system.success.message.1"}]}`)
      } catch(err) {
        overworld.runCommandAsync(`tellraw @a {"rawtext":[{"translate":"mcpk.system.error.message"}]}`)
      }
    } else {
      // if database is found
      const database = CheckPointSignData[0];
      for (const tag of database.getTags()) {
        var blockVector = JSON.parse(tag);
        CheckPointList.push(blockVector)
      }
      overworld.runCommandAsync(`tellraw @a {"rawtext":[{"translate":"mcpk.system.success.message.2"}]}`)
    }
  }
}

function CheckRecord(name) {
  if (logBook[name] >= (curTick-1)) {
    logBook[name] = curTick;
    return false
  } else {
    logBook[name] = curTick;
    return true
  }
}

function CheckRecord2(name) {
  if (logBook2[name] >= (curTick-1)) {
    logBook2[name] = curTick;
    return false
  } else {
    logBook2[name] = curTick;
    return true
  }
}

//initialize for newly joined player
world.events.playerSpawn.subscribe(data => {
  const player = data.player
  const name = player.nameTag;
  const tags = player.getTags();
  var tagFounder1 = false;
  var tagFounder2 = false;
  try {
    for (const item of tags) { 
      if (item.slice(0,19) === 'McpkPositionRecord:') {
        if (!tagFounder1) {
          PlayerInfo[name] = JSON.parse(item.slice(19));
          tagFounder1 = true;
        } else {
          player.removeTag(item)
        }
      } else if (item.slice(0,15) === 'McpkTempRecord:') {
        if (!tagFounder2) {
          TempCheckPoint[name] = JSON.parse(item.slice(15))
          tagFounder2 = true;
        } else {
          player.removeTag(item)
        }
      }
    }
  } catch(err) {}
  CoordDisplay[name] = 0;
})

//simple functions when player use certain items
world.events.beforeItemUseOn.subscribe(data => {
  const { blockLocation, item } = data;
  const player = data.source;
  const name = player.nameTag;
  const { dimension } = data.source;
  const block = dimension.getBlock(blockLocation);
  const blockVector = [blockLocation.x,blockLocation.y,blockLocation.z];

  if (CheckRecord(name)) {
    //coordinate display mode
    if (item.typeId === 'mcpk:position_display_normal') {
      if (CoordDisplay[name] === 1) {
        CoordDisplay[name] = 0;
        overworld.runCommandAsync(`titleraw ${name} actionbar {"rawtext":[{"text":" "}]}`)
      } else {
        CoordDisplay[name] = 1;
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.debug.activate"}]}`)
      }
    } else if (item.typeId === 'mcpk:position_display_advanced') {
      if (CoordDisplay[name] === 2) {
        CoordDisplay[name] = 0;
        overworld.runCommandAsync(`titleraw ${name} actionbar {"rawtext":[{"text":" "}]}`)
      } else {
        CoordDisplay[name] = 2;
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.debugPro.activate"}]}`)
      }

    //return to previous checkpoint
    } else if (item.typeId === 'mcpk:checkpoint_returner') {
      if (PlayerInfo[name] === undefined || PlayerInfo[name].x === undefined) {
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.error.message.1"}]}`)
      } else if (!player.hasTag('is_practising')) {
        logBook2[name] = curTick;
        player.addTag('mcpk_return_cp')
      } else {
        const { x, y, z, f } = TempCheckPoint[name];
        player.teleport(new Location(x,y,z),overworld,player.rotation.x,f,false)
      }

    //change facing
    } else if (item.typeId === 'mcpk:rotation_editor' && player.velocity.y === StaticVelocity) {
      try {
        const { x, y, z } = player.location;
        player.teleport(new Location(x,y,z),overworld,player.rotation.x,PlayerInfo[name].f,false )
      } catch(err) {
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.rotation.error.message.1"}]}`)
      }
    
    //set checkpoint
    } else if ((block.typeId === 'minecraft:wall_sign' || block.typeId === 'minecraft:standing_sign') && item.typeId !== 'mcpk:checkpoint_editor') {
      //examine all the possible locations for the checkpoint signs
      for (const item of CheckPointList) {
        if (contains(item,blockVector)) {
          if (player.velocity.y === StaticVelocity && !player.hasTag('is_practising')) {
            const { x, y, z } = player.location;

            //store data
            try {
              var PlayerLocation = {'x':x,'y':y,'z':z,'f':PlayerInfo[name].f}
            } catch(err) {
              var PlayerLocation = {'x':x,'y':y,'z':z}
            }
            const PlayerOldTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
            const PlayerNewTag = "McpkPositionRecord:"+JSON.stringify(PlayerLocation);
            PlayerInfo[name] = PlayerLocation;
            player.removeTag(PlayerOldTag);
            player.addTag(PlayerNewTag);
            overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.set.message"}]}`);
            break
          } else {
            overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.error.message.2"}]}`);
            break
          }
        }
      }

    //make the sign a checkpoint
    } else if ((block.typeId === 'minecraft:wall_sign' || block.typeId === 'minecraft:standing_sign') && item.typeId === 'mcpk:checkpoint_editor') {
      var NotRegistered = true;
      for (const item of CheckPointList) {
        if (contains(item,blockVector)) {
          NotRegistered = false;
          break
        }
      }
      
      if (NotRegistered) {
        CheckPointList.push(blockVector);
        let CheckPointSignData = Array.from(theEnd.getEntities(dbquery));
        CheckPointSignData[0].addTag(JSON.stringify(blockVector));
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.register.message"}]}`)
      }
    }
  }
})

//two and four decimal places coordinate display
function getPlayerPos() {
  for (const player of world.getPlayers()) {
    const name = player.nameTag;
    if (CoordDisplay[name] === 1) {
      const x = player.location.x.toFixed(2);
      const y = player.location.y.toFixed(2);
      const z = player.location.z.toFixed(2);
      const f = player.rotation.y.toFixed(2);
      const p = player.rotation.x.toFixed(2);
      overworld.runCommandAsync(`title ${name} actionbar X: ${x} | Y: ${y} | Z: ${z} | F/P: ${f} / ${p}`)
    } else if (CoordDisplay[name] === 2) {
      const x = player.location.x.toFixed(4);
      const y = player.location.y.toFixed(4);
      const z = player.location.z.toFixed(4);
      const f = player.rotation.y.toFixed(4);
      const p = player.rotation.x.toFixed(4);
      overworld.runCommandAsync(`title ${name} actionbar X: ${x} | Y: ${y} | Z: ${z} | F/P: ${f} / ${p}`)
    }
  }
}

//modify the checkpoint system through removing unused ones
world.events.blockBreak.subscribe(data => {
  const { brokenBlockPermutation, block } = data;
  if (brokenBlockPermutation.type.id === 'minecraft:wall_sign' || brokenBlockPermutation.type.id === 'minecraft:standing_sign') {
    const { x, y, z } = block.location;
    const blockVector = [ x, y, z];
    for (var i = 0; i < CheckPointList.length; i++) {
      if (contains(CheckPointList[i],blockVector)) {
        CheckPointList.splice(i,1);
        overworld.runCommandAsync(`tellraw ${data.player.nameTag} {"rawtext":[{"translate":"mcpk.checkpoint.unregister.message"}]}`);
        let CheckPointSignData = Array.from(theEnd.getEntities(dbquery));
        CheckPointSignData[0].removeTag(JSON.stringify(blockVector));
        break
      }
    }
  }
})

//set rotation, patch return to checkpoint error, add practise checkpoint
world.events.beforeItemUse.subscribe(data => {
  const player = data.source;
  const name = player.nameTag;
  const { item } = data;

  if (item.typeId === 'mcpk:rotation_editor') {
    const logform = new ModalFormData()
    .title("Change Rotation")
    .textField(`Your current rotation\n${player.rotation.y.toFixed(6)}\nWrite nothing indicates deleting the current rotation\n`, `Please enter a number`)
    logform.show(player).then((result) => {
      const value = result.formValues[0];
      if (value !== "" && !isNaN(value)) {
        //delete old record
        const PlayerOldTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
        player.removeTag(PlayerOldTag);
        if (PlayerInfo[name] === undefined) {
          PlayerInfo[name] = {}
        }
        PlayerInfo[name].f = Number(value);

        //new facing
        const PlayerNewTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
        player.addTag(PlayerNewTag);
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.rotation.set.message"}]}`)
      } else if (value === "" && PlayerInfo[name].f !== undefined) {
        //delete old record
        const PlayerOldTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
        player.removeTag(PlayerOldTag);
        delete PlayerInfo[name].f;

        //update information
        const PlayerNewTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
        player.addTag(PlayerNewTag);
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.rotation.remove.message"}]}`)
      } else {
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.rotation.error.message.2"}]}`)
      }
    });

    //fix the error where checkpoint returner does not work when click the air
  } else if (item.typeId === 'mcpk:checkpoint_returner') {
    if (PlayerInfo[name] === undefined || PlayerInfo[name].x === undefined) {
      overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.error.message.1"}]}`)
    } else if (!player.hasTag('is_practising')) {
      logBook2[name] = curTick;
      player.addTag('mcpk_return_cp')
    } else {
      const { x, y, z, f } = TempCheckPoint[name];
      player.teleport(new Location(x,y,z),overworld,player.rotation.x,f,false)
    }

    //practise checkpoint set up
  } else if (item.typeId === 'mcpk:temp_checkpoint_editor' && player.velocity.y === StaticVelocity ) {
    if (!player.hasTag('is_practising')) {
      const { x, y, z } = player.location;
      const f = player.rotation.y;

      //store data
      var PlayerLocation = {'x':x,'y':y,'z':z,'f':f};
      const PlayerNewTag = "McpkTempRecord:"+JSON.stringify(PlayerLocation);
      TempCheckPoint[name] = PlayerLocation;
      player.addTag(PlayerNewTag);
      player.addTag('is_practising');
      overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.practise.activate"}]}`)
    } else {
      //return to cp and remove temp checkpoint
      logBook2[name] = curTick;
      player.addTag('mcpk_tempcp_return')
    }
  }
})

//block checkpoint or simply return or clear checkpoint
function CheckPointBlock() {
  for (const player of world.getPlayers()) {
    const name = player.nameTag;
    if (!player.hasTag('is_practising')) {
      if (player.hasTag('mcpk_set_cp')) {

        //store data
        if (CheckRecord2(name)) {
          const { x, y, z } = player.location;
          try {
            var PlayerLocation = {'x':x,'y':y,'z':z,'f':PlayerInfo[name].f}
          } catch(err) {
            var PlayerLocation = {'x':x,'y':y,'z':z}
          }
          const PlayerOldTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
          const PlayerNewTag = "McpkPositionRecord:"+JSON.stringify(PlayerLocation);
          PlayerInfo[name] = PlayerLocation;
          player.removeTag(PlayerOldTag);
          player.addTag(PlayerNewTag);
          overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.set.message"}]}`)
        }

        //return to checkpoint
      } else if (player.hasTag('mcpk_return_cp')) {
        try {
          const { x, y, z } = PlayerInfo[name];
          var f = player.rotation.y;
          if (PlayerInfo[name].f !== undefined) {
            var f = PlayerInfo[name].f
          }
          player.teleport(new Location(x,y,z),overworld,player.rotation.x,f,false)
        } catch(err) {}

        //remove checkpoint
      } else if (player.hasTag('mcpk_clear_cp')) {
        const PlayerOldTag = "McpkPositionRecord:"+JSON.stringify(PlayerInfo[name]);
        player.removeTag(PlayerOldTag);
        delete PlayerInfo[name];
        overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.checkpoint.remove.message"}]}`)
      }
    }

      //delete temporary checkpoint
    if (player.hasTag('mcpk_tempcp_return')) {
      const { x, y, z, f } = TempCheckPoint[name];
      player.teleport(new Location(x,y,z),overworld,player.rotation.x,f,false);

      const PlayerOldTag = "McpkTempRecord:"+JSON.stringify(TempCheckPoint[name]);
      player.removeTag(PlayerOldTag);
      player.removeTag('is_practising');
      delete TempCheckPoint[name];
      overworld.runCommandAsync(`tellraw ${name} {"rawtext":[{"translate":"mcpk.practise.deactivate"}]}`)
    }

    player.removeTag('mcpk_set_cp');
    player.removeTag('mcpk_return_cp');
    player.removeTag('mcpk_clear_cp');
    player.removeTag('mcpk_tempcp_return')
  }
}

//update every tick
world.events.tick.subscribe(getPlayerPos);
world.events.tick.subscribe(CheckPointBlock);
world.events.tick.subscribe(gameTick)
