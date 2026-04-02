import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar.tsx';

function App() {
  //all 12 notes of scale
  const notes = ["C", "C#", "D", "E♭", "E", "F", "F#", "G", "A♭", "A", "B♭", "B"];

  type ChordType = 
    | "major"
    | "minor"
    | "dim"
    | "aug"
    | "maj7"
    | "min7"
    | "aug7"
    | "7"
    | "dim7"
    | "halfdim7";

  type Chord = {
    name: string;
    notes: string[];
  }

  const chordTypes: Record<ChordType, number[]> = {
    major: [0, 4, 7],
    minor: [0, 3, 7], 
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    maj7: [0, 4, 7, 11], 
    min7: [0, 3, 7, 10], 
    aug7: [0, 4, 8, 10], 
    "7": [0, 4, 7, 10], 
    dim7: [0, 3, 6, 9], 
    halfdim7: [0, 3, 6, 10]
  };

  //Build a chord from a root note (from notes array) and type (from chordTypes)
  function getChord(root: string, type: ChordType) : string[] {
    // Find the index of the root note
    const rootIndex = notes.indexOf(root);

    // Create the chord notes using the intervals
    return chordTypes[type].map((interval:number) => {
      // Add interval and wrap around if needed
      // Wrap around to keep midi notes above 12 in the same octave
      const index = (rootIndex + interval) % 12;

      // Return the note at that position
      return notes[index];
    });
  }
  // Generate a random chord (this is what will be displayed)
  function getRandomChord(): Chord {
    // Pick a random root note
    const root = notes[Math.floor(Math.random() * notes.length)];

    // Randomly pick a chord type
    function getRandomChordType(): ChordType{
      const types = Object.keys(chordTypes) as ChordType[];
      return types[Math.floor(Math.random() * types.length)]; //e.g. types[Math.floor(0.34 * 10)] = types[3] = aug
    }

    const type: ChordType = getRandomChordType();
    return {
      name: `${root} ${type}`,     // e.g. "E minor"
      notes: getChord(root, type) // e.g. ["E", "G", "B"]
    };
  }

  // Store the current chord
  const [chord, setChord] = useState<Chord | null>(null);

   //Controlling when the program should stop generating a new chord;
  const [running, setRunning] = useState(false);


  //timer value after which a new chord is generated
  const [selectedNumber, setSelectedNumber] = useState("5");
  const [countdownNumber, setCountdownNumber] = useState(Number(selectedNumber)); // to show time left

  useEffect(() => {
    if (!running) return;

    setCountdownNumber(Number(selectedNumber));

    const timer = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev <= 1) {
          setChord(getRandomChord());
          return Number(selectedNumber);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer); //cleanup function
  }, [running, selectedNumber]);

  // Create a new random chord
  function generateChord() {
    setChord(getRandomChord());
    setCountdownNumber(Number(selectedNumber));
    setRunning(true);
  }
  return (
    <>
      <Navbar/>
      <div>
        <h1>Chord</h1>

        {/* Show chord name */}
        <p className='chordName'>
          {chord ? chord.name : "Press Start"}
        </p>

        <h3>Time left: {countdownNumber}</h3>

        <h2>Set time</h2>
        <select 
          value={selectedNumber}
          onChange={(e) => setSelectedNumber(e.target.value)}
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
          <option value="11">11</option>
          <option value="12">12</option>
          <option value="13">13</option>
          <option value="14">14</option>
          <option value="15">15</option>
          <option value="16">16</option>
          <option value="17">17</option>
          <option value="18">18</option>
          <option value="19">19</option>
          <option value="20">20</option>
        </select>

        <p>Selected time: {selectedNumber} seconds</p>
        {/* Button to get a new chord */}
        <button onClick={() => {
          if (running) {
            setRunning(false);
          } else {
            generateChord();
          }
        }}>
          {running? "Stop" : "Start"}
        </button>
      </div>
    </>
  )
}

export default App
