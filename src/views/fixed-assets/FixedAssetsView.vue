<template>
  <div class="space-y-4" @click="showProductDropdown = false">

    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-700">Fixed Assets</h2>
      <button @click.stop="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">+ Add Asset</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-fit">
      <button @click="activeTab = 'assets'" :class="activeTab === 'assets' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">All Assets</button>
      <button v-if="canApprove" @click="activeTab = 'approvals'; fetchApprovals()" :class="activeTab === 'approvals' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'" class="px-4 py-2 rounded-lg text-sm font-medium transition">
        Pending Approvals
        <span v-if="pendingApprovalsCount > 0" class="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{{ pendingApprovalsCount }}</span>
      </button>
    </div>

    <!-- Assets Tab -->
    <div v-if="activeTab === 'assets'">
      <div class="bg-white rounded-xl shadow-sm p-4 flex gap-3">
        <input v-model="search" @input="fetchAssets" type="text" placeholder="Search by name, tag, CIU IMS ID..."
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select v-model="filterStatus" @change="fetchAssets" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="in_store">In Store</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="disposed">Disposed</option>
        </select>
        <select v-model="filterDept" @change="fetchAssets" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Departments</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-7 gap-3 mt-4">
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-gray-700">{{ assetStats.total || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-purple-600">{{ assetStats.in_store || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">In Store</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-green-600">{{ assetStats.available || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Available</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-blue-600">{{ assetStats.assigned || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Assigned</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-orange-500">{{ assetStats.pending_approval || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-yellow-600">{{ assetStats.under_maintenance || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Maintenance</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-3 text-center">
          <p class="text-xl font-bold text-red-500">{{ assetStats.disposed || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Disposed</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr class="text-left text-gray-500">
              <th class="px-4 py-3">Asset Tag</th>
              <th class="px-4 py-3">CIU IMS ID</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Condition</th>
              <th class="px-4 py-3 w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" class="text-center py-8 text-gray-400">Loading...</td></tr>
            <tr v-else-if="assets.length === 0"><td colspan="8" class="text-center py-8 text-gray-400">No assets found</td></tr>
            <tr v-for="asset in assets" :key="asset.id" class="border-b hover:bg-gray-50 transition">
              <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">{{ asset.asset_tag }}</span></td>
              <td class="px-4 py-3">
                <span v-if="asset.serial_number" class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">{{ asset.serial_number }}</span>
                <span v-else class="text-gray-400 text-xs">-</span>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-700">{{ asset.name }}</p>
                <p class="text-xs text-gray-400">{{ asset.model }}</p>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ asset.assetCategory?.name || asset.asset_category?.name || '-' }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ asset.department?.name || '-' }}</td>
              <td class="px-4 py-3">
                <span :class="{
                  'bg-purple-100 text-purple-700': asset.status === 'in_store',
                  'bg-green-100 text-green-700': asset.status === 'available',
                  'bg-blue-100 text-blue-700': asset.status === 'assigned',
                  'bg-orange-100 text-orange-700': asset.status === 'pending_approval',
                  'bg-yellow-100 text-yellow-700': asset.status === 'under_maintenance',
                  'bg-red-100 text-red-700': asset.status === 'disposed',
                }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ asset.status?.replace(/_/g, ' ') }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="{
                  'bg-green-100 text-green-700': asset.condition === 'good',
                  'bg-yellow-100 text-yellow-700': asset.condition === 'fair',
                  'bg-orange-100 text-orange-700': asset.condition === 'poor',
                  'bg-red-100 text-red-700': asset.condition === 'damaged',
                }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ asset.condition }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1 flex-wrap">
                  <button @click="openModal(asset)" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-pencil"></i> Edit</button>

                  <template v-if="canApprove">
                    <button v-if="asset.status === 'in_store'" @click="openDistributeModal(asset)" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-package"></i> Distribute</button>
                    <button v-if="asset.status === 'available' || asset.status === 'in_store'" @click="openAssignModal(asset)" class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-user-check"></i> Assign</button>
                    <button v-if="asset.status === 'available' || asset.status === 'assigned'" @click="openTransferModal(asset)" class="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-transfer"></i> Transfer</button>
                    <button v-if="asset.status === 'assigned'" @click="openReturnConfirm(asset)" class="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-arrow-back-up"></i> Return</button>
                    <button v-if="asset.status !== 'disposed'" @click="openDisposeModal(asset)" class="bg-orange-100 text-orange-500 hover:bg-orange-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-trash"></i> Dispose</button>
                  </template>

                  <template v-else-if="isStoreAdmin">
                    <button v-if="asset.status === 'in_store'" @click="openRequestModal(asset, 'distribute')" class="bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-package"></i> Request Distribute</button>
                    <button v-if="asset.status === 'available' || asset.status === 'in_store'" @click="openRequestModal(asset, 'assign')" class="bg-green-100 text-green-600 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-user-check"></i> Request Assign</button>
                    <button v-if="asset.status === 'available' || asset.status === 'assigned'" @click="openRequestModal(asset, 'transfer')" class="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-transfer"></i> Request Transfer</button>
                    <button v-if="asset.status !== 'disposed' && asset.status !== 'pending_approval'" @click="openRequestModal(asset, 'dispose')" class="bg-orange-100 text-orange-500 hover:bg-orange-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-trash"></i> Request Dispose</button>

                    <span v-if="asset.status === 'pending_approval'" class="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-medium">Awaiting Approval</span>
                  </template>

                  <button @click="viewHistory(asset)" class="bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-history"></i> History</button>
                  <button @click="deleteAsset(asset.id)" class="bg-red-100 text-red-500 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition"><i class="ti ti-x"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="px-4 py-3 flex justify-between items-center border-t text-sm text-gray-500">
          <span>Total: {{ pagination.total }} assets</span>
          <div class="flex gap-2">
            <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
            <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
            <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Approvals Tab -->
    <div v-if="activeTab === 'approvals'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3">Asset</th>
            <th class="px-4 py-3">Action</th>
            <th class="px-4 py-3">Requested By</th>
            <th class="px-4 py-3">Details</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loadingApprovals"><td colspan="6" class="text-center py-8 text-gray-400">Loading...</td></tr>
          <tr v-else-if="approvals.length === 0"><td colspan="6" class="text-center py-8 text-gray-400">No pending approvals</td></tr>
          <tr v-for="approval in approvals" :key="approval.id" class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-700">{{ approval.fixed_asset?.name }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ approval.fixed_asset?.asset_tag }}</p>
            </td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-green-100 text-green-700': approval.action === 'assign',
                'bg-indigo-100 text-indigo-700': approval.action === 'transfer',
                'bg-purple-100 text-purple-700': approval.action === 'distribute',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                {{ approval.action }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ approval.requested_by?.name }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">
              <div v-if="approval.action === 'assign'">
                <span class="text-gray-400">Employee:</span> {{ getEmployeeName(approval.payload?.employee_id) }}<br>
                <span class="text-gray-400">Dept:</span> {{ getDeptName(approval.payload?.department_id) }}
              </div>
              <div v-else-if="approval.action === 'transfer'">
                <span class="text-gray-400">To Dept:</span> {{ getDeptName(approval.payload?.to_department_id) }}<br>
                <span class="text-gray-400">To Room:</span> {{ getRoomName(approval.payload?.to_room_id) }}
              </div>
              <div v-else-if="approval.action === 'distribute'">
                <span class="text-gray-400">Dept:</span> {{ getDeptName(approval.payload?.department_id) }}<br>
                <span class="text-gray-400">Room:</span> {{ getRoomName(approval.payload?.room_id) }}
              </div>
            </td>
            <td class="px-4 py-3">
              <span :class="{
                'bg-yellow-100 text-yellow-700': approval.status === 'pending',
                'bg-green-100 text-green-700': approval.status === 'approved',
                'bg-red-100 text-red-700': approval.status === 'rejected',
              }" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                {{ approval.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div v-if="approval.status === 'pending'" class="flex gap-2">
                <button @click="approveRequest(approval)" :disabled="saving" class="bg-green-100 text-green-600 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50"><i class="ti ti-check"></i> Approve</button>
                <button @click="openRejectApproval(approval)" class="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium transition"><i class="ti ti-x"></i> Reject</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <AppModal :show="showModal" :title="editingAsset ? 'Edit Asset' : 'Add Fixed Asset'" max-width="max-w-2xl" @close="closeModal">
      <div v-if="formError" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{{ formError }}</div>
      <form @submit.prevent="saveAsset" class="space-y-3" @click.stop>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Asset Name *</label>
            <input v-model="form.name" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Quantity</label>
            <input v-model="form.quantity" type="number" min="1" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Model</label>
            <input v-model="form.model" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">CIU IMS ID (one per line)</label>
            <textarea v-model="serialNumbersText" rows="3" placeholder="e.g. CIU-2024-CP-01-3409" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            <p class="text-xs text-gray-400 mt-1">For bulk add, enter one ID per line</p>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Asset Category</label>
            <select v-model="form.asset_category_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Category</option>
              <option v-for="ac in assetCategories" :key="ac.id" :value="ac.id">{{ ac.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Brand</label>
            <select v-model="form.brand_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Brand</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
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
            <label class="text-xs font-medium text-gray-600">Room</label>
            <select v-model="form.room_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Room</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.room_number }})</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Purchase Date</label>
            <input v-model="form.purchase_date" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Purchase Cost</label>
            <input v-model="form.purchase_cost" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Warranty Expiry</label>
            <input v-model="form.warranty_expiry" type="date" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Condition</label>
            <select v-model="form.condition" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-xs font-medium text-gray-600">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none"></textarea>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="closeModal" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Request Approval Modal (store-admin) -->
    <AppModal :show="showRequestModal" :title="'Request ' + requestAction + ' Approval'" @close="showRequestModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="submitRequest" class="space-y-3">
        <template v-if="requestAction === 'assign'">
          <div>
            <label class="text-xs font-medium text-gray-600">Employee *</label>
            <select v-model="requestForm.employee_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Employee</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }} ({{ e.employee_id }})</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Department</label>
            <select v-model="requestForm.department_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </template>
        <template v-else-if="requestAction === 'transfer'">
          <div>
            <label class="text-xs font-medium text-gray-600">To Department *</label>
            <select v-model="requestForm.to_department_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">To Room</label>
            <select v-model="requestForm.to_room_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Room</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.room_number }})</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Reason</label>
            <input v-model="requestForm.reason" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
          </div>
        </template>
        <template v-else-if="requestAction === 'distribute'">
          <div>
            <label class="text-xs font-medium text-gray-600">Department *</label>
            <select v-model="requestForm.department_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Room</label>
            <select v-model="requestForm.room_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="">Select Room</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.room_number }})</option>
            </select>
          </div>
        </template>
        <template v-else-if="requestAction === 'dispose'">
          <div>
            <label class="text-xs font-medium text-gray-600">Disposal Date *</label>
            <input v-model="requestForm.disposal_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Method *</label>
            <select v-model="requestForm.method" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
              <option value="written_off">Written Off</option>
              <option value="sold">Sold</option>
              <option value="donated">Donated</option>
              <option value="scrapped">Scrapped</option>
              <option value="damaged">Damaged/Lost</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Reason</label>
            <textarea v-model="requestForm.reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none"></textarea>
          </div>
        </template>
        <div>
          <label class="text-xs font-medium text-gray-600">Notes</label>
          <input v-model="requestForm.notes" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showRequestModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Submitting...' : 'Submit Request' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Reject Approval Modal -->
    <AppModal :show="showRejectApprovalModal" title="Reject Approval" max-width="max-w-sm" @close="showRejectApprovalModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedApproval?.fixed_asset?.name }}</p>
      <div class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Reason for rejection *</label>
          <textarea v-model="rejectRemarks" required rows="3" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
        </div>
        <div class="flex gap-3">
          <button @click="showRejectApprovalModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="rejectRequest" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">{{ saving ? 'Rejecting...' : 'Reject' }}</button>
        </div>
      </div>
    </AppModal>

    <!-- Distribute Modal -->
    <AppModal :show="showDistributeModal" title="Distribute Asset" @close="showDistributeModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="submitDistribute" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Department *</label>
          <select v-model="distributeForm.department_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Department</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Room</label>
          <select v-model="distributeForm.room_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Room</option>
            <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.room_number }})</option>
          </select>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showDistributeModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Distributing...' : 'Distribute' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Assign Modal -->
    <AppModal :show="showAssignModal" title="Assign Asset" @close="showAssignModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="assignAsset" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Employee *</label>
          <select v-model="assignForm.employee_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Employee</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }} ({{ e.employee_id }})</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Department</label>
          <select v-model="assignForm.department_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Department</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Assigned Date *</label>
          <input v-model="assignForm.assigned_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showAssignModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Assigning...' : 'Assign' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Transfer Modal -->
    <AppModal :show="showTransferModal" title="Transfer Asset" @close="showTransferModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="submitTransfer" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">To Department *</label>
          <select v-model="transferForm.to_department_id" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Department</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">To Room</label>
          <select v-model="transferForm.to_room_id" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="">Select Room</option>
            <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} ({{ r.room_number }})</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Reason</label>
          <input v-model="transferForm.reason" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showTransferModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50" style="background: linear-gradient(135deg, #1A3A6B, #2a5298);">{{ saving ? 'Transferring...' : 'Transfer' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- Dispose Modal -->
    <AppModal :show="showDisposeModal" title="Dispose Asset" @close="showDisposeModal = false">
      <p class="text-sm text-gray-500 mb-4">{{ selectedAsset?.name }} ({{ selectedAsset?.asset_tag }})</p>
      <form @submit.prevent="submitDispose" class="space-y-3">
        <div>
          <label class="text-xs font-medium text-gray-600">Disposal Date *</label>
          <input v-model="disposeForm.disposal_date" type="date" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Method *</label>
          <select v-model="disposeForm.method" required class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none">
            <option value="written_off">Written Off</option>
            <option value="sold">Sold</option>
            <option value="donated">Donated</option>
            <option value="scrapped">Scrapped</option>
            <option value="damaged">Damaged/Lost</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Disposal Value</label>
          <input v-model="disposeForm.disposal_value" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none" />
        </div>
        <div>
          <label class="text-xs font-medium text-gray-600">Reason</label>
          <textarea v-model="disposeForm.reason" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="showDisposeModal = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm transition disabled:opacity-50">{{ saving ? 'Processing...' : 'Dispose Asset' }}</button>
        </div>
      </form>
    </AppModal>

    <!-- History Modal -->
    <AppModal :show="showHistoryModal" title="Asset History" max-width="max-w-2xl" @close="showHistoryModal = false">
      <div v-if="historyData" class="space-y-4">
        <div class="bg-gray-50 rounded-xl p-4">
          <p class="font-semibold text-gray-700">{{ historyData.asset?.name }}</p>
          <p class="text-sm text-gray-500">Tag: {{ historyData.asset?.asset_tag }}</p>
          <p v-if="historyData.asset?.serial_number" class="text-xs text-blue-600 font-mono mt-1">CIU IMS ID: {{ historyData.asset?.serial_number }}</p>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-600 mb-2">Assignments</h4>
          <div v-if="!historyData.assignments?.length" class="text-sm text-gray-400">No assignments</div>
          <div v-for="a in historyData.assignments" :key="a.id" class="flex justify-between items-center py-2 border-b text-sm">
            <div>
              <p class="font-medium text-gray-700">{{ a.employee?.name }}</p>
              <p class="text-xs text-gray-400">{{ a.assigned_date }} to {{ a.return_date || 'Current' }}</p>
            </div>
            <span :class="a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'" class="px-2 py-0.5 rounded-full text-xs">{{ a.status }}</span>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-600 mb-2">Maintenance Records</h4>
          <div v-if="!historyData.maintenances?.length" class="text-sm text-gray-400">No maintenance records</div>
          <div v-for="m in historyData.maintenances" :key="m.id" class="py-2 border-b text-sm">
            <p class="font-medium text-gray-700 capitalize">{{ m.type }} - Tk {{ formatNumber(m.cost) }}</p>
            <p class="text-xs text-gray-400">{{ m.maintenance_date }} | {{ m.status }}</p>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Confirm Modal (Delete & Return) -->
    <AppModal :show="showConfirm" :title="confirmAction === 'delete' ? 'Delete Asset' : 'Return Asset'" max-width="max-w-sm" @close="showConfirm = false">
      <div class="text-center">
        <p class="text-sm font-medium text-gray-700 mb-1">{{ confirmTitle }}</p>
        <p class="text-xs text-gray-400 mb-6">{{ confirmMessage }}</p>
        <div class="flex gap-3">
          <button @click="showConfirm = false" class="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
          <button @click="confirmProceed" :disabled="saving"
            :class="confirmAction === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'"
            class="flex-1 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
            {{ saving ? 'Processing...' : (confirmAction === 'delete' ? 'Yes, Delete' : 'Yes, Return') }}
          </button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'
import AppModal from '../../components/ui/AppModal.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const userRole = computed(() => {
  const roles = auth.user?.roles
  if (!roles) return ''
  const first = Array.isArray(roles) ? roles[0] : Object.values(roles)[0]
  return typeof first === 'string' ? first : first?.name ?? ''
})
const canApprove = computed(() => ['super-admin', 'fixed-asset-admin'].includes(userRole.value))
const isStoreAdmin = computed(() => userRole.value === 'store-admin')

const assets = ref([])
const assetCategories = ref([])
const brands = ref([])
const departments = ref([])
const rooms = ref([])
const employees = ref([])
const approvals = ref([])
const loading = ref(false)
const loadingApprovals = ref(false)
const saving = ref(false)
const activeTab = ref('assets')
const pendingApprovalsCount = ref(0)

const showModal = ref(false)
const showAssignModal = ref(false)
const showDistributeModal = ref(false)
const showDisposeModal = ref(false)
const showHistoryModal = ref(false)
const showConfirm = ref(false)
const showTransferModal = ref(false)
const showRequestModal = ref(false)
const showRejectApprovalModal = ref(false)
const showProductDropdown = ref(false)

const editingAsset = ref(null)
const selectedAsset = ref(null)
const selectedApproval = ref(null)
const confirmDeleteId = ref(null)
const confirmAction = ref(null)
const confirmTitle = ref('')
const confirmMessage = ref('')
const formError = ref(null)
const historyData = ref(null)
const serialNumbersText = ref('')
const search = ref('')
const filterStatus = ref('')
const filterDept = ref('')
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const assetStats = ref({})
const requestAction = ref('')
const rejectRemarks = ref('')

const requestForm = ref({ employee_id: '', department_id: '', room_id: '', to_department_id: '', to_room_id: '', reason: '', notes: '',disposal_date: new Date().toISOString().split('T')[0],method: 'written_off', disposal_value: 0 })
const transferForm = ref({ to_department_id: '', to_room_id: '', reason: '' })
const assignForm = ref({ employee_id: '', department_id: '', assigned_date: '', notes: '' })
const distributeForm = ref({ department_id: '', room_id: '' })
const disposeForm = ref({ disposal_date: new Date().toISOString().split('T')[0], method: 'written_off', disposal_value: 0, reason: '' })
const form = ref({ name: '', quantity: 1, serial_number: '', model: '', asset_category_id: '', brand_id: '', department_id: '', room_id: '', purchase_date: '', purchase_cost: '', warranty_expiry: '', condition: 'good', description: '' })

function formatNumber(num) { return Number(num || 0).toLocaleString() }

// Helper functions for displaying names in approvals
function getDeptName(id) {
  if (!id) return '-'
  return departments.value.find(d => d.id === Number(id))?.name || `ID: ${id}`
}
function getRoomName(id) {
  if (!id) return '-'
  return rooms.value.find(r => r.id === Number(id))?.name || `ID: ${id}`
}
function getEmployeeName(id) {
  if (!id) return '-'
  return employees.value.find(e => e.id === Number(id))?.name || `ID: ${id}`
}

async function fetchAssets(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/fixed-assets', { params: { page, per_page: 15, search: search.value, status: filterStatus.value, department_id: filterDept.value } })
    assets.value = res.data.data.data
    pagination.value = { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total }
    fetchStats()
  } finally { loading.value = false }
}

async function fetchMasterData() {
  try {
    const [ac, b, d, r, e] = await Promise.all([
      api.get('/asset-categories', { params: { per_page: 100 } }),
      api.get('/brands', { params: { per_page: 100 } }),
      api.get('/departments', { params: { per_page: 100 } }),
      api.get('/rooms', { params: { per_page: 100 } }),
      api.get('/employees', { params: { per_page: 100 } }),
    ])
    assetCategories.value = ac.data.data.data
    brands.value = b.data.data.data
    departments.value = d.data.data.data
    rooms.value = r.data.data.data
    employees.value = e.data.data.data
  } catch (err) { console.error('Failed to load master data', err) }
}

async function fetchStats() {
  try {
    const res = await api.get('/fixed-assets/stats')
    assetStats.value = res.data.data
  } catch (err) { console.error('Failed to load stats', err) }
}

async function fetchApprovals() {
  loadingApprovals.value = true
  try {
    const res = await api.get('/asset-approvals', { params: { status: 'pending', per_page: 50 } })
    approvals.value = res.data.data.data
    pendingApprovalsCount.value = res.data.data.total
  } catch (err) { console.error('Failed to load approvals', err) }
  finally { loadingApprovals.value = false }
}

function openModal(asset = null) {
  editingAsset.value = asset
  formError.value = null
  serialNumbersText.value = asset ? (asset.serial_number || '') : ''
  form.value = asset ? {
    name: asset.name, quantity: 1, serial_number: asset.serial_number || '',
    model: asset.model || '', asset_category_id: asset.asset_category_id || '',
    brand_id: asset.brand?.id || '', department_id: asset.department?.id || '',
    room_id: asset.room?.id || '',
    purchase_date: asset.purchase_date?.split('T')[0] || '',
    purchase_cost: asset.purchase_cost || '',
    warranty_expiry: asset.warranty_expiry?.split('T')[0] || '',
    condition: asset.condition || 'good', description: asset.description || '',
  } : { name: '', quantity: 1, serial_number: '', model: '', asset_category_id: '', brand_id: '', department_id: '', room_id: '', purchase_date: '', purchase_cost: '', warranty_expiry: '', condition: 'good', description: '' }
  showModal.value = true
}

function closeModal() { showModal.value = false; editingAsset.value = null }

async function saveAsset() {
  saving.value = true; formError.value = null
  try {
    const serialNumbers = serialNumbersText.value.split('\n').map(s => s.trim()).filter(s => s.length > 0)
    const payload = { ...form.value, serial_numbers: serialNumbers }
    if (editingAsset.value) {
      payload.serial_number = serialNumbers[0] ?? null
      await api.put(`/fixed-assets/${editingAsset.value.id}`, payload)
    } else {
      await api.post('/fixed-assets', payload)
    }
    closeModal(); fetchAssets()
  } catch (err) { formError.value = err.response?.data?.message || 'Something went wrong' }
  finally { saving.value = false }
}

function openRequestModal(asset, action) {
  selectedAsset.value = asset
  requestAction.value = action
  requestForm.value = { employee_id: '', department_id: '', room_id: '', to_department_id: '', to_room_id: '', reason: '', notes: '' }
  showRequestModal.value = true
}

async function submitRequest() {
  saving.value = true
  try {
    const endpoints = { assign: 'request-assign', transfer: 'request-transfer', distribute: 'request-distribute',dispose: 'request-dispose' }
    await api.post(`/fixed-assets/${selectedAsset.value.id}/${endpoints[requestAction.value]}`, requestForm.value)
    showRequestModal.value = false
    fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

async function approveRequest(approval) {
  saving.value = true
  try {
    await api.patch(`/asset-approvals/${approval.id}/approve`)
    fetchApprovals(); fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Could not approve') }
  finally { saving.value = false }
}

function openRejectApproval(approval) {
  selectedApproval.value = approval
  rejectRemarks.value = ''
  showRejectApprovalModal.value = true
}

async function rejectRequest() {
  if (!rejectRemarks.value.trim()) { alert('Please enter a reason for rejection'); return }
  saving.value = true
  try {
    await api.patch(`/asset-approvals/${selectedApproval.value.id}/reject`, { remarks: rejectRemarks.value })
    showRejectApprovalModal.value = false
    fetchApprovals(); fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Could not reject') }
  finally { saving.value = false }
}

function openAssignModal(asset) {
  selectedAsset.value = asset
  assignForm.value = { employee_id: '', department_id: asset.department?.id || '', assigned_date: new Date().toISOString().split('T')[0], notes: '' }
  showAssignModal.value = true
}

async function assignAsset() {
  saving.value = true
  try {
    await api.post(`/fixed-assets/${selectedAsset.value.id}/assign`, assignForm.value)
    showAssignModal.value = false; fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

function openDistributeModal(asset) {
  selectedAsset.value = asset
  distributeForm.value = { department_id: '', room_id: '' }
  showDistributeModal.value = true
}

async function submitDistribute() {
  saving.value = true
  try {
    await api.patch(`/fixed-assets/${selectedAsset.value.id}/distribute`, distributeForm.value)
    showDistributeModal.value = false; fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

function openTransferModal(asset) {
  selectedAsset.value = asset
  transferForm.value = { to_department_id: '', to_room_id: '', reason: '' }
  showTransferModal.value = true
}

async function submitTransfer() {
  saving.value = true
  try {
    await api.post(`/fixed-assets/${selectedAsset.value.id}/transfer`, transferForm.value)
    showTransferModal.value = false; fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

function openReturnConfirm(asset) {
  selectedAsset.value = asset
  confirmAction.value = 'return'
  confirmTitle.value = `Return "${asset.name}"?`
  confirmMessage.value = `Tag: ${asset.asset_tag} - Asset will be marked as Available.`
  showConfirm.value = true
}

function deleteAsset(id) {
  confirmDeleteId.value = id
  confirmAction.value = 'delete'
  confirmTitle.value = 'Delete this asset?'
  confirmMessage.value = 'This action cannot be undone.'
  showConfirm.value = true
}

async function confirmProceed() {
  saving.value = true
  try {
    if (confirmAction.value === 'delete') {
      await api.delete(`/fixed-assets/${confirmDeleteId.value}`)
    } else if (confirmAction.value === 'return') {
      await api.post(`/fixed-assets/${selectedAsset.value.id}/return`, { return_date: new Date().toISOString().split('T')[0] })
    }
    showConfirm.value = false; confirmDeleteId.value = null; confirmAction.value = null
    fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

function openDisposeModal(asset) {
  selectedAsset.value = asset
  disposeForm.value = { disposal_date: new Date().toISOString().split('T')[0], method: 'written_off', disposal_value: 0, reason: '' }
  showDisposeModal.value = true
}

async function submitDispose() {
  saving.value = true
  try {
    await api.post(`/fixed-assets/${selectedAsset.value.id}/dispose`, disposeForm.value)
    showDisposeModal.value = false; fetchAssets()
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
  finally { saving.value = false }
}

async function viewHistory(asset) {
  try {
    const res = await api.get(`/fixed-assets/${asset.id}/history`)
    historyData.value = res.data.data
    showHistoryModal.value = true
  } catch (err) { alert(err.response?.data?.message || 'Something went wrong') }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  fetchAssets(page)
}

onMounted(() => {
  fetchAssets()
  fetchMasterData()
  if (canApprove.value) fetchApprovals()
})
</script>