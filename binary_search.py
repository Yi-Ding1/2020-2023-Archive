def binary_search(arr, x):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2

        if arr[mid] == x:
            return mid
        elif arr[mid] < x:
            low = mid + 1
        else:
            high = mid - 1
    
    return -1

my_array = [1,6,8,66,66,66,70,82,90,91]
search_value = 66

result_index = binary_search(my_array, search_value)
if result_index == -1:
    print("The search value was not found in the array.")
else:
    print(f'Value found at index {result_index}')