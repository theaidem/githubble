import { Schema } from 'normalizr'

let event = new Schema('events')
let actor = new Schema('actors')
let repo = new Schema('repos')

event.define({
	actor: actor,
	repo: repo
})

export const eventSchema = event