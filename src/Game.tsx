import * as React from "react"
import { FunctionComponent, Component, useState, useEffect } from "react"
import * as ReactDOM from 'react-dom'
import { DragDropContext, Droppable, DropResult, ResponderProvided, Draggable } from 'react-beautiful-dnd'
const KeyboardEventHandler = require('react-keyboard-event-handler')

// function to help us with reordering the result
const reorder = (list: any[], startIndex: number, endIndex: number): any[] => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const grid = 8

const getItemStyle = (isDragging: boolean, draggableStyle: any, feedback: boolean, correct: boolean) => ({
  // some basic styles
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 ${grid}px 0 0`,

  // change background colour if dragging
  background: isDragging ? 'lightgreen' : 'grey',
  border: `${feedback ? `2px solid ${correct ? 'green' : 'red'}` : ''}`,

  // styles we need to apply on draggables
  ...draggableStyle,
})

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  display: 'flex',
  padding: grid,
  overflow: 'auto'
})

const shuffleArray = (arr: any[]): any[] => arr.sort(() => Math.random() - 0.5)

interface InitialProps {
  word: string
}

interface PastState {
  letters: string[]
  input: string[]
}

interface State {
  word: string[]
  letters: string[]
  input: string[]
  pastStates: PastState[]
  showFeedback: boolean
}

class Game extends Component<InitialProps, State> {
  constructor(props: InitialProps) {
    super(props)

    const state: State = {
      word: this.props.word.toUpperCase().split(''),
      letters: shuffleArray(this.props.word.toUpperCase().split('')),
      input: [],
      pastStates: [],
      showFeedback: false
    }

    this.state = state

    this.onDragEnd = this.onDragEnd.bind(this)
  }

  // alpha keys to respond to (shift+key does not work, but upper and lower case letters are both fine and evaluate to uppercase)
  letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

  updateState(newState: State) {
    const previousState = {
      letters: this.state.letters,
      input: this.state.input
    }

    this.setState({
      ...this.state,
      ...newState,
      pastStates: [...this.state.pastStates, previousState]
    })
  }

  revertState() {
    if (this.state.pastStates.length > 0) {
      const pastStates = [...this.state.pastStates]
      const newState = pastStates.splice(-1, 1)[0]
      this.setState({
        ...newState,
        showFeedback: false,
        pastStates: pastStates
      })
    }
  }

  onDragEnd(result: DropResult, _source: ResponderProvided) {
    // dropped outside the list
    if (!result.destination) {
      return
    }

    const letters = reorder(
      this.state.letters,
      result.source.index,
      result.destination.index
    )

    this.updateState({
      ...this.state,
      letters,
      showFeedback: false,
      input: [],
      pastStates: []
    })
  }

  onLetter(key: string) {
    // the key exists in 'letters' and it's already in 'input' less times than it exists in 'letters' (and by extension the word)
    if (
      this.state.letters.findIndex(l => l === key) !== -1
      && this.state.letters.filter(l => l === key).length > this.state.input.filter(i => i === key).length
    ) {
      const input = [...this.state.input, key]

      // always use the last one if there are more than one instance of the same letter in the given word
      const lastInputValueLetterIndex = this.state.letters.join('').lastIndexOf(key)

      this.updateState({
        ...this.state,
        showFeedback: false,
        input: [...this.state.input, key],
        letters: reorder(this.state.letters, lastInputValueLetterIndex, input.length-1)
      })
    }
  }

  onBackspace() {
    if (this.state.input.length > 0) {
      this.revertState()
    }
  }

  onEnter() {
    this.updateState({
      ...this.state,
      showFeedback: true
    })
  }

  // This could probably be split out into components, but in the
  // interest of making this file a bit more readable I'll let it be
  render() {
    return (
      <div>
        <KeyboardEventHandler
          handleKeys={this.letters}
          onKeyEvent={(key: string, _e: Event) => this.onLetter(key)} />
        <KeyboardEventHandler
          handleKeys={['backspace']}
          onKeyEvent={(_key: string, _e: Event) => this.onBackspace()} />
        <KeyboardEventHandler
          handleKeys={['enter']}
          onKeyEvent={(_key: string, _e: Event) => this.onEnter()} />
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}
                {...provided.droppableProps}
              >
                {this.state.letters.map((item, index) => (
                  <Draggable key={index} draggableId={`${item}${index}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style,
                          this.state.showFeedback,
                          item === this.state.word[index]
                        )}
                      >
                        {item}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    )
  }
}

const GameWrapper = () => {
  const words = ["Family", "Happiness", "Watermelon"]
  const randomWord = words[Math.floor(Math.random() * words.length)]
  return <Game word={randomWord} />
}

export default GameWrapper
