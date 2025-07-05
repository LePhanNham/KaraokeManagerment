import type React from "react"
import type { Room } from "../../types/interfaces"
import RoomCard from "./RoomCard"

interface RoomListProps {
  rooms: Room[]
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onEdit={() => room.id && onEdit(room.id)}
          onDelete={() => room.id && onDelete(room.id)}
        />
      ))}
    </div>
  )
}

export default RoomList
