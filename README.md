# The Path Behind — Maze Game


## Group Number


Group 4B


## Description


The first level of The Path Behind is a top-down maze game played against a two-minute clock. The player navigates a foggy cornfield maze towards the exit, revealing corridors by walking them. Scattered through the maze is food, which the player may choose to eat by stopping on it and pressing a key, then solving a short mental-math question before the meal completes. The catch is hidden in the fog: going without food causes the trail the player has already revealed to fade back into darkness, erasing their own map of where they have been. Eating costs time and mental effort against a ticking clock, so skipping always feels efficient in the moment but the player who restricts loses the knowledge they need to finish. When the player is not moving, their character and its shadow visibly distort and swell, creating discomfort. Through gameplay, players discover on their own that steady eating is the only way to reach the exit.


## Design Rationale

**Affordances**
The game leans on affordances so the player learns by looking rather than by being told. The impassable walls of corn and leafy objects read as boundaries with no collision tutorial needed. The lit trail behind the player affords a felt sense of "I've been here," turning walked corridors into readable memory; when it fades back to darkness it affords the opposite  "this is unknown again", prompting hesitation exactly where the player used to feel sure. Food's distinct sprite affords "this is interactable," and the "Press E to eat" prompt, appearing only when standing on it, marks eating as a deliberate, optional act. Most deliberately, the game inverts the usual affordance of stillness: where most games make standing still feel safe, ours makes rest visibly uncomfortable through the warping sprite, teaching through discomfort that stopping is where something is wrong.

**GameFlow** 
The core lesson is players who eat consistently are the ones who finish. While never stated; it emerges through the player's own trial and error. Feedback is immediate: the timer counts in real time, the trail lights as you walk and fades when you restrict, and the sprite distorts the moment you stop. Instant restart lowers the cost of failure and rewards experimentation, while a minimal interface keeps concentration on moment-to-moment decisions.

**Integration of the condition**
We represented body dysmorphia by distorting the sprite when the player is not on the move, modelling how people experiencing anorexia specifically struggle with obsessing over their body image which is why  many experiencing that will turn to exercising and other restrictions/ activities to remedy that [1].
We represented how meals are no longer neutral as eating costs time and mental effort and we represented that through a math puzzle that costs the player time so skipping feels efficient in the moment, yet restriction silently erases the trail behind you.
The fog represents the brain fog and fatigue of having anorexia [1].


## Setup and Interaction Instructions


To run the sketch locally, open `index.html` in Google Chrome using Live Server
(a local server is recommended so the font, images, and audio load correctly).


**Controls:**


- Start: SPACE (from the splash screen)
- Move: WASD or arrow keys
- Eat: E (while standing on a food tile — solve the math question to finish)
- Restart: R (after win or loss)


Reach the glowing exit before the 2:00 timer runs out. Stop on food and press E
to eat; the timer keeps running while you solve the mental-math question.


## Iteration Notes


**Post-Playtest — changes made based on playtesting:**
1. Realized that players did not understand right away the main game mechanic of swiping away the bad thoughts and letting the food fall to the ground. We tweaked the tutorial screen for the important info to stand out more.
2. Realized that the theme of eating disorders was not immediately understood at times through our idea and should also be handled more thoughtfully. We decided to do more thorough research in order to figure out a way to more effectively incorporate our disorder into a game.
3. Understood that the concept behind the initial version of our game was flawed and needed to be iterated upon. Ultimately we decided that the entire idea for the game should be redone. 



**Post-Showcase — planned improvements if iteration continued:**
Potentially zooming in more on the character sprite to immerse the player more into the experience and to enhance the visual detail of the body pixelation/dysmorphia.
Possibly changing the action that is required to “eat” the food the action of eating as the mental math problems come off as a bit too educational for some players.




## Assets

| File                                            | Source                                   |
| ----------------------------------------------- | ---------------------------------------- |
| `assets/fonts/Dogica`                           | Dogica font — Roberto Mocci, DaFont [2]  |
| `assets/images/Game_background.png`             | Original — created by Reymart [3]        |
| `assets/images/Maze_path/Path_beginning.png`    | Original — created by Reymart [3]        |
| `assets/images/Maze_path/Path_end.png`          | Original — created by Reymart [3]        |
| `assets/images/Maze_path/Path_intersection.png` | Original — created by Reymart [3]        |
| `assets/images/Maze_path/Path_right_angle.png`  | Original — created by Reymart [3]        |
| `assets/images/Maze_path/Path_straight.png`     | Original — created by Reymart [3]        |
| `assets/images/Maze_path/Path_T_shape.png`      | Original — created by Reymart [3]        |
| `assets/images/Obstacles/Corn_1.png`            | Original — created by Reymart [3]        |
| `assets/images/Obstacles/Corn_2.png`            | Original — created by Reymart [3]        |
| `assets/images/Obstacles/Corn_3.png`            | Original — created by Reymart [3]        |
| `assets/images/Obstacles/leaf.png`              | Original — created by Reymart [3]        |
| `assets/images/Character_sprite_sheet.png`      | Original — created by Reymart [3]        |
| `assets/images/Food/Food_1_Bread.png`           | Original — created by Reymart [3]        |
| `assets/images/Food/Food_2_Corn.png`            | Original — created by Reymart [3]        |
| `assets/images/Fog/Fog_1.png`                   | Original — created by Reymart [3]        |
| `assets/images/Fog/Fog_2.png`                   | Original — created by Reymart [3]        |
| `assets/images/Question_Box_final.png`          | Original — created by Reymart [3]        |
| `assets/images/Splash.png`                      | Original — created by Reymart [3]        |
| `assets/sounds/background_music.mp3`            | Blue Saga, Epidemic Sound [4]            |
| `assets/sounds/walk_sound.mp3`                  | freefire66, Freesound [5]                |
| `assets/sounds/eat_sound.mp3`                   | InspectorJ, Freesound [6]                |
| `assets/sounds/victory_sound.mp3`               | tuudurt, Freesound [7]                   |

*[3] All original image assets were created by Reymart Gutierrez for this project.*

## References

[1] Cleveland Clinic. [n.d.]. Anorexia Nervosa. Retrieved July 8, 2026 from
https://my.clevelandclinic.org/health/diseases/9794-anorexia-nervosa

[2] Roberto Mocci. [n.d.]. Dogica. Retrieved July 8, 2026 from
https://www.dafont.com/dogica.font

[3] Reymart Gutierrez. 2026. Original game art assets (backgrounds, maze tiles,
obstacles, character sprite, food, fog, UI). Created for this project.

[4] Blue Saga. 2025. Soundbed. Epidemic Sound. Retrieved July 5, 2026 from
https://www.epidemicsound.com/music/tracks/5a2536b3-2ec2-4b9b-bc45-00abbf620352/

[5] freefire66. 2013. grass1. Freesound. Retrieved July 5, 2026 from
https://freesound.org/people/freefire66/sounds/175955/

[6] InspectorJ. [n.d.]. Chewing, Carrot, A. Freesound. Retrieved July 5, 2026
from https://freesound.org/people/InspectorJ/sounds/412068/

[7] tuudurt. [n.d.]. Level Win. Freesound. Retrieved July 5, 2026 from
https://freesound.org/people/tuudurt/sounds/258142/

[8] balancedwithhannah. 2025. Overcoming The Lies | Battling an Eating Disorder
+ Exercise Addiction | My Testimony. (September 25, 2025). Retrieved July 8,
2026 from https://youtu.be/t5KVWGX62P8

[9] Julianna Zalescik. 2020. My Eating Disorder Story. (April 2020). Retrieved
July 8, 2026 from https://youtu.be/7kZ6PUEQqYQ

[10] Via Li. 2024. STOP TORTURING YOURSELF | My Eating Disorder Story + Things
I've Learned. (April 2024). Retrieved July 8, 2026 from
https://youtu.be/3q9VZYn8VqU

[11] NHS 24. 2025. Abigail's Story: Recovering from Anorexia and a Binge Eating
Disorder. (December 2025). Retrieved July 8, 2026 from
https://youtu.be/s7nBob9T6Lo


