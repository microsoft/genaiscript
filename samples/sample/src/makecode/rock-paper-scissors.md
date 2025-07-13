# Rock Paper Scissors

## {Introduction @unplugged}

![Cartoon of the Rock Paper Scissors game](/static/mb/projects/a4-motion.png)

Turn your micro:bit into a **Rock Paper Scissors** game that you can play with your friends!

## {Step 1}

First we need to make a variable to keep track of whether we have a Rock, Paper or Scissors in our hand. A variable is a container for storing values. Click on the ``||variables:Variables||`` category in the Toolbox. Click on the **Make a Variable** button. Give your new variable the name "hand" and click Ok.

![A animation that shows how to create a variable](/static/mb/projects/rock-paper-scissors/newvar.gif)

## {Step 2}

Click on the ``||variables:Variables||`` category in the Toolbox again. You'll notice that there are some new blocks that have appeared. Drag a ``||variables:set hand||`` block into the ``||input:on shake||`` block. We'll start our Rock Paper Scissors game when we shake 👋 our micro:bit.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = 0
})
```

## {Step 3}

Click on the ``||math:Math||`` category in the Toolbox. Drag a ``||math:pick random||`` block and drop it into the ``||variables:set hand||`` block replacing the number 0. Now when we shake our micro:bit, the variable hand will contain a random number between 1 and 3.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
})
```

## {Step 4}

Click on the ``||logic:Logic||`` category in the Toolbox. Drag the ``||logic:if true then else||`` block out to the workspace and drop it into the ``||input:on shake||`` block under the ``||variables:set hand||`` block.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (true) {
    	
    } else {
    	
    }
})
```

## {Step 5}

From the ``||logic:Logic||`` category, drag a ``||logic:0 = 0||`` comparison block and drop it into the ``||logic:if true then else||`` block replacing **true**.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (0 == 0) {
    	
    } else {
    	
    }
})
```

## {Step 6}

Click on the ``||variables:Variables||`` category in the Toolbox. Drag a ``||variables:hand||`` block out and drop it into the ``||logic:0 = 0||`` comparison block replacing the first **0**.  Click on the second 0 in the comparison block and change to **1**.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	
    } else {
    	
    }
})
```

## {Step 7}

Click on the ``||basic:Basic||`` category in the Toolbox. Drag a ``||basic:show icon||`` block out and drop it under ``||logic:if hand = 1 then||``. In the ``||basic:show icon||`` block, click on the Heart icon and instead select the small square icon to represent a 💎 Rock.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	basic.showIcon(IconNames.SmallSquare)
    } else {
    	
    }
})
```

## {Step 8}

At the bottom of the ``||logic:if then else||`` block, click on the plus **'+'** sign. This will expand the code to include an ``||logic:else if||`` clause.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	basic.showIcon(IconNames.SmallSquare)
    } else if (false) {
    	
    } else {
    	
    }
})
```

## {Step 9}

From the ``||logic:Logic||`` category, drag a ``||logic:0 = 0||`` comparison block and drop it into the open space next to the ``||logic:else if||`` clause.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	basic.showIcon(IconNames.SmallSquare)
    } else if (0 == 0) {
    	
    } else {
    	
    }
})
```

## {Step 10}

From the ``||variables:Variables||`` category, drag a ``||variables:hand||`` block and drop it into the ``||logic:0 = 0||`` comparison block replacing the first **0**.  Click on the second 0 in the comparison block and change to **2**.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	basic.showIcon(IconNames.SmallSquare)
    } else if (hand == 2) {
    	
    } else {
    	
    }
})
```

## {Step 11}

From the ``||basic:Basic||`` category, drag a ``||basic:show icon||`` block out and drop it under ``||logic:else if hand = 2 then||``. In the ``||basic:show icon||`` block, click on the Heart icon and instead select the large square icon to represent 📃 Paper.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	basic.showIcon(IconNames.SmallSquare)
    } else if (hand == 2) {
    	basic.showIcon(IconNames.Square)
    } else {
    	
    }
})
```

## {Step 12}

Now let's deal with the last condition - if our hand variable isn't holding a 1 (Rock) or a 2 (Paper), then it must be 3 (✀ Scissors)! From the ``||basic:Basic||`` category, drag another ``||basic:show icon||`` block out and drop it into the last opening under the ``||logic:else||``.  In the ``||basic:show icon||`` block, click on the Heart icon and select the Scissors icon.

```blocks
let hand = 0;
input.onGesture(Gesture.Shake, function() {
    hand = randint(1, 3)
    if (hand == 1) {
    	basic.showIcon(IconNames.SmallSquare)
    } else if (hand == 2) {
    	basic.showIcon(IconNames.Square)
    } else {
    	basic.showIcon(IconNames.Scissors)
    }
})
```

## {Step 13}

Let's test your code! Press the white **SHAKE** button on the micro:bit on-screen simulator, or move your cursor quickly back and forth over the simulator. Do you see the icons for rock, paper and scissors randomly appear?  ⭐ Great job! ⭐

![Shaking a @boardname@ simulator](/static/mb/projects/rock-paper-scissors/rpssim3.gif)

## {Step 14}

If you have a @boardname@ device, connect it to your computer and click the ``|Download|`` button. Follow the instructions to transfer your code onto the @boardname@. Once your code has been downloaded, attach your micro:bit to a battery pack and challenge another micro:bit or a human to a game of Rock, Paper, Scissors!

![A @boardname@ in a hand](/static/mb/projects/rock-paper-scissors/hand.jpg)

## {Step 15}

Go further - Try adding 🎵 Music 🎵 blocks to your Rock Paper Scissors game for different sound effects. Note that some Music blocks may require a micro:bit v2 device to play.

```blocks
let hand = 0
input.onGesture(Gesture.Shake, function () {
    hand = randint(1, 3)
    if (hand == 1) {
        basic.showIcon(IconNames.SmallSquare)
        music.play(music.builtinPlayableSoundEffect(soundExpression.giggle), music.PlaybackMode.UntilDone)
    } else if (hand == 2) {
        basic.showIcon(IconNames.Square)
        music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    } else {
        basic.showIcon(IconNames.Scissors)
        music.play(music.createSoundExpression(WaveShape.Square, 1600, 1, 255, 0, 300, SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.UntilDone)
    }
})
```

```blockconfig.global
randint(1, 3)
```

```template
input.onGesture(Gesture.Shake, function() {})
```