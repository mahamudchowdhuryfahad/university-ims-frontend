<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Rooms / Locations</h2>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Room</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
      <input v-model="search" @input="fetchRooms" type="text" placeholder="Search by name or room number..."
        class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterBuilding" @change="fetchRooms" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
        <option value="">All Buildings</option>
        <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Room</th>
            <th class="px-4 py-3">Number</th>
            <th class="px-4 py-3">Building</th>
            <th class="px-4 py-3">Department</th>
            <th class="px-4 py-3">Floor</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="rooms.length === 0"><td colspan="8" class="text-center py-8 text-gray-400">No rooms found</td></tr>
          <tr v-for="room in rooms" :key="room.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 text-gray-400">{{ room.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ room.name }}</td>
            <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">{{ room.room_number }}</span></td>
            <td class="px-4 py-3 text-gray-500">{{ room.building?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ room.department?.name || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ room.floor }}</td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-blue-100 text-blue-700': room.type === 'lab',
                'bg-green-100 text-green-700': room.type === 'office',
                'bg-yellow-100 text-yellow-700': room.type === 'classroom',
                'bg-purple-100 text-purple-700': room.type === 'store',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">{{ room.type }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openModal(room)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 rounded-lg text-xs font-medium transition">✏️ Edit</button>
                <button @click="deleteRoom(room.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-medium transition">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
        <span>Total: {{ pagination.total }} rooms</span>
        <div class="flex gap-2">
          <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AppModal :show="showModal" :title="editingRoom ? 'Edit Room' : 'Add Room'" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveRoom" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Room Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Room Number *</label>
            <input v-model="form.room_number" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Floor</label>
            <input v-model="form.floor" type="number" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Building *</label>
            <select v-model="form.building_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Building</option>
              <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Department</label>
            <select v-model="form.department_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Type</label>
            <select v-model="form.type" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="office">Office</option>
              <option value="lab">Lab</option>
              <option value="classroom">Classroom</option>
              <option value="store">Store</option>
            </select>
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <input v-model="form.is_active" type="checkbox" id="is_active" />
            <label for="is_active" class="text-sm text-gray-600">Active</label>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal :show="showConfirm" title="Delete Room" max-width="max-w-sm" @close="showConfirm = false">
      <div class="text-center">
        <div class="text-5xl mb-4">🗑️</div>
        <p class="text-sm text-gray-500 mb-6">Are you sure? This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="confirmDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition">Yes, Delete</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'

const rooms = ref([])
const buildings = ref([])
const departments = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showConfirm = ref(false)
const editingRoom = ref(null)
const confirmDeleteId = ref(null)
const formError = ref(null)
const search = ref('')
const filterBuilding = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const form = ref({ name: '', room_number: '', building_id: '', department_id: '', floor: 1, type: 'office', is_active: true })

async function fetchRooms(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/rooms', { params: { page, per_page: 15, search: search.value, building_id: filterBuilding.value } })
    rooms.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
  } finally { loading.value = false }
}

async function fetchMasterData() {
  try {
    const [b, d] = await Promise.all([
      api.get('/buildings', { params: { per_page: 100 } }),
      api.get('/departments', { params: { per_page: 100 } }),
    ])
    buildings.value = b.data.data.data
    departments.value = d.data.data.data
  } catch (err) {
    console.error('Failed to load master data', err)
  }
}

function openModal(room = null) {
  editingRoom.value = room
  formError.value = null
  form.value = room ? { name: room.name, room_number: room.room_number, building_id: room.building?.id || '', department_id: room.department?.id || '', floor: room.floor, type: room.type, is_active: room.is_active }
    : { name: '', room_number: '', building_id: '', department_id: '', floor: 1, type: 'office', is_active: true }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingRoom.value = null }

async function saveRoom() {
  saving.value = true; formError.value = null
  try {
    if (editingRoom.value) { await api.put(`/rooms/${editingRoom.value.id}`, form.value) }
    else { await api.post('/rooms', form.value) }
    closeModal(); fetchRooms()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function deleteRoom(id) { confirmDeleteId.value = id; showConfirm.value = true }

async function confirmDelete() {
  try {
    await api.delete(`/rooms/${confirmDeleteId.value}`)
    showConfirm.value = false
    confirmDeleteId.value = null
    fetchRooms()
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete room')
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchRooms(page)
}

onMounted(() => { fetchRooms(); fetchMasterData() })
</script>